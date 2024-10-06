import crypto from 'crypto'
import { createSingletonProxy } from '@core/di'
import { Logger, LoggerService } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import {
  ReferralCampaignInsert,
  ReferralCampaignTable,
  ReferrerBalanceTable,
  ReferrerPayoutTable,
  ReferrerSettingsTable,
  ReferrerTransactionTable,
  ReferrerWithdrawalTable,
  UserSelect,
} from '@dbs/games-schema'
import { ReferralAction } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import { and, desc, eq, lte, sql, sum } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { locks } from './locks'
import { dayjs } from './shared/dayjs'

type CreateReferralCampaignPayload = Omit<ReferralCampaignInsert, 'code'> & {
  referrerId: string
}

const LATIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CODE_ALPHABET = `${LATIN_ALPHABET}${LATIN_ALPHABET.toLowerCase()}0123456789`

function randomChar(alphabet: string) {
  return alphabet[crypto.randomInt(alphabet.length)]
}

const RTP_FEE = 0.05
const PAYMENT_FEE = 0.05
const FEE = RTP_FEE + PAYMENT_FEE

@singleton()
export class AffiliateService {
  logger: Logger

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.logger.child('Affiliate')
  }

  private generateNextPayoutDate() {
    let current = dayjs().tz('Europe/Moscow')

    // Skip today
    current = current.add(1, 'day')

    while (current.date() !== 1 && current.date() !== 15) {
      current = current.add(1, 'day')
    }

    // Distribute payout time randomly between 2 and 6 hours
    const hour = crypto.randomInt(2, 7)

    return current.set('hour', hour).set('minute', 0).set('second', 0).toDate()
  }

  generateCode(length = 6) {
    return Array.from({ length }, () => randomChar(CODE_ALPHABET)).join('')
  }

  async getCampaign(code: string) {
    const campaign = await gamesDb.query.ReferralCampaignTable.findFirst({
      where: eq(ReferralCampaignTable.code, code),
    })

    return campaign
  }

  async incrementCampaignVisits({
    tx,
    campaignId,
  }: {
    tx?: typeof gamesDb
    campaignId: number
  }) {
    const db = tx ?? gamesDb

    await db
      .update(ReferralCampaignTable)
      .set({ totalVisits: sql`${ReferralCampaignTable.totalVisits} + 1` })
      .where(eq(ReferralCampaignTable.id, campaignId))
  }

  async incrementCampaignSignups({
    tx,
    campaignId,
  }: {
    tx?: typeof gamesDb
    campaignId: number
  }) {
    const db = tx ?? gamesDb

    await db
      .update(ReferralCampaignTable)
      .set({ totalSignups: sql`${ReferralCampaignTable.totalSignups} + 1` })
      .where(eq(ReferralCampaignTable.id, campaignId))
  }

  async getReferrerSettings(referrerId: string) {
    const cached = await gamesCaches.referrerSettings.get(referrerId)

    if (cached) {
      return cached
    }

    const settings = await gamesDb.query.ReferrerSettingsTable.findFirst({
      where: eq(ReferrerSettingsTable.referrerId, referrerId),
    })

    if (!settings) {
      return null
    }

    await gamesCaches.referrerSettings.set(referrerId, settings)
    return settings
  }

  async getReferrerBalance(referrerId: string) {
    const cached = await gamesCaches.referrerBalance.get(referrerId)

    if (cached) {
      return cached
    }

    const balance = await gamesDb.query.ReferrerBalanceTable.findFirst({
      where: eq(ReferrerBalanceTable.referrerId, referrerId),
    })

    if (!balance) {
      return null
    }

    await gamesCaches.referrerBalance.set(referrerId, balance)
    return balance
  }

  async createReferralCampaign({
    tx,
    payload,
  }: {
    tx?: typeof gamesDb
    payload: CreateReferralCampaignPayload
  }) {
    const db = tx ?? gamesDb

    const code = this.generateCode()

    const campaign = await db
      .insert(ReferralCampaignTable)
      .values({ ...payload, code })
      .returning()

    return campaign
  }

  async createReferrerPayout({
    tx,
    referrerId,
  }: {
    tx?: typeof gamesDb
    referrerId: string
  }) {
    const db = tx ?? gamesDb

    const nextPayoutAt = this.generateNextPayoutDate()

    const [payout] = await db
      .insert(ReferrerPayoutTable)
      .values({ referrerId, nextPayoutAt })
      .returning()

    return payout
  }

  async createReferrerWithdrawal({
    tx,
    referrerId,
    amount,
  }: {
    tx?: typeof gamesDb
    referrerId: string
    amount: number
  }) {
    const db = tx ?? gamesDb

    const withdrawal = await db
      .insert(ReferrerWithdrawalTable)
      .values({
        amount,
        referrerId,
      })
      .returning()

    return withdrawal
  }

  async updateReferrerBalance({
    tx,
    referrerId,
    available,
  }: {
    tx?: typeof gamesDb
    referrerId: string
    available: number
  }) {
    const db = tx ?? gamesDb

    const [updatedReferrerBalance] = await db
      .update(ReferrerBalanceTable)
      .set({ available })
      .where(eq(ReferrerBalanceTable.referrerId, referrerId))
      .returning()

    return updatedReferrerBalance
  }

  async processReferralTransaction({
    tx,
    referral,
    referralAction,
    amount,
  }: {
    tx?: typeof gamesDb
    referral: UserSelect
    referralAction: ReferralAction
    amount: number
  }) {
    const db = tx ?? gamesDb
    const { referrerId, referralCampaignId } = referral

    if (!referrerId) {
      return
    }

    const settings = await this.getReferrerSettings(referrerId)

    if (!settings) {
      return
    }

    const finalAmount = (amount - amount * FEE) * (settings.revShare / 100)

    const transaction = await db.insert(ReferrerTransactionTable).values({
      referrerId,
      referralAction,
      referralCampaignId,
      referralId: referral.id,
      amount: finalAmount,
    })

    return transaction
  }

  async processReferrerPayouts() {
    const now = new Date()
    const nextPayoutAt = this.generateNextPayoutDate()

    /**
     * Fixate the last transaction id to prevent false-positive `isProcessed` updates
     */
    const [lastTransaction] = await gamesDb
      .select({ id: ReferrerTransactionTable.id })
      .from(ReferrerTransactionTable)
      .orderBy(desc(ReferrerTransactionTable.id))
      .limit(1)

    if (!lastTransaction) {
      this.logger.info('No transactions to process')
      return
    }

    const pendingPayouts = await gamesDb
      .select({
        referrerId: ReferrerTransactionTable.referrerId,
        totalAmount: sum(ReferrerTransactionTable.amount).mapWith(Number),
      })
      .from(ReferrerTransactionTable)
      .innerJoin(
        ReferrerPayoutTable,
        eq(ReferrerTransactionTable.referrerId, ReferrerPayoutTable.referrerId),
      )
      .where(
        and(
          lte(ReferrerTransactionTable.id, lastTransaction.id),
          eq(ReferrerTransactionTable.isProcessed, false),
          lte(ReferrerPayoutTable.nextPayoutAt, now),
        ),
      )
      .groupBy(ReferrerTransactionTable.referrerId)

    if (pendingPayouts.length === 0) {
      this.logger.info('No pending payouts')
      return
    }

    for (const { referrerId, totalAmount } of pendingPayouts) {
      if (totalAmount === 0) {
        continue
      }

      await locks.with([locks.referrerBalance(referrerId)], async () => {
        await gamesDb.transaction(async (tx) => {
          await tx
            .update(ReferrerBalanceTable)
            .set({
              available: sql`${ReferrerBalanceTable.available} + ${totalAmount}`,
            })
            .where(eq(ReferrerBalanceTable.referrerId, referrerId))

          await tx
            .update(ReferrerTransactionTable)
            .set({ isProcessed: true })
            .where(
              and(
                lte(ReferrerTransactionTable.id, lastTransaction.id),
                eq(ReferrerTransactionTable.referrerId, referrerId),
                eq(ReferrerTransactionTable.isProcessed, false),
              ),
            )

          await tx
            .update(ReferrerPayoutTable)
            .set({ nextPayoutAt, lastPayoutAt: now })
            .where(eq(ReferrerPayoutTable.referrerId, referrerId))

          await gamesCaches.referrerBalance.del(referrerId)
          await gamesCaches.lastReferrerTransactions.del(referrerId)
        })
      })
    }
  }
}

export const affiliateService = createSingletonProxy(AffiliateService)
