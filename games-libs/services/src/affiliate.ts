import crypto from 'crypto'
import { Logger, loggerService } from '@core/logger'
import { takeFirstOrThrow } from '@core/utils'
import {
  ReferralCampaignInsert,
  ReferralCampaignTable,
  ReferrerBalanceSelect,
  ReferrerBalanceTable,
  ReferrerPayoutTable,
  ReferrerSettingsTable,
  ReferrerTransactionTable,
  ReferrerWithdrawalTable,
} from '@dbs/games-schema'
import { ReferralAction } from '@dbs/games-types'
import { gamesDb } from '@games/services'
import { and, desc, eq, lte, sql, sum } from 'drizzle-orm'
import { gamesCache } from './cache'
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

export class AffiliateService {
  logger: Logger

  constructor() {
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

  private async queryReferrerSettings(referrerId: string) {
    const settings = await gamesDb.query.ReferrerSettingsTable.findFirst({
      where: eq(ReferrerSettingsTable.referrerId, referrerId),
    })

    return settings ?? null
  }

  async getReferrerSettings(referrerId: string) {
    if (!gamesCache.ready) {
      return this.queryReferrerSettings(referrerId)
    }

    const cached = await gamesCache.referrerSettings.get(referrerId)
    if (cached) return cached

    const settings = await this.queryReferrerSettings(referrerId)
    if (!settings) return null

    await gamesCache.referrerSettings.set(referrerId, settings)
    return settings
  }

  private async queryReferrerBalance(referrerId: string) {
    const balance = await gamesDb.query.ReferrerBalanceTable.findFirst({
      where: eq(ReferrerBalanceTable.referrerId, referrerId),
    })

    return balance ?? null
  }

  async getReferrerBalance(referrerId: string) {
    if (!gamesCache.ready) {
      return this.queryReferrerBalance(referrerId)
    }

    const cached = await gamesCache.referrerBalance.get(referrerId)
    if (cached) return cached

    const balance = await this.queryReferrerBalance(referrerId)
    if (!balance) return null

    await gamesCache.referrerBalance.set(referrerId, balance)
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
      .values({ amount, referrerId })
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
  }): Promise<ReferrerBalanceSelect> {
    const db = tx ?? gamesDb

    const updatedReferrerBalance = await db
      .update(ReferrerBalanceTable)
      .set({ available })
      .where(eq(ReferrerBalanceTable.referrerId, referrerId))
      .returning()
      .then(takeFirstOrThrow)

    return updatedReferrerBalance
  }

  async processReferralTransaction({
    tx,
    referralId,
    referrerId,
    referralCampaignId,
    referralAction,
    amount,
  }: {
    tx?: typeof gamesDb
    referralId: string
    referrerId: string | null
    referralCampaignId: number | null
    referralAction: ReferralAction
    amount: number
  }) {
    const db = tx ?? gamesDb

    if (!referrerId) {
      return
    }

    const settings = await this.getReferrerSettings(referrerId)

    if (!settings) {
      return
    }

    const finalAmount = (amount - amount * FEE) * (settings.revShare / 100)

    await db.insert(ReferrerTransactionTable).values({
      referrerId,
      referralAction,
      referralCampaignId,
      referralId,
      amount: finalAmount,
    })
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

      await gamesDb.transaction(async (tx) => {
        await tx
          .select()
          .from(ReferrerBalanceTable)
          .where(eq(ReferrerBalanceTable.referrerId, referrerId))
          .for('update')

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
      })

      await gamesCache.referrerBalance.del(referrerId)
      await gamesCache.lastReferrerTransactions.del(referrerId)
    }
  }
}

export const affiliateService = new AffiliateService()
