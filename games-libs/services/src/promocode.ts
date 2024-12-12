import { Logger, loggerService } from '@core/logger'
import { takeFirstOrThrow } from '@core/utils'
import {
  BalanceSelect,
  BalanceTable,
  PromocodeSelect,
  PromocodeTable,
  PromocodeUsageTable,
} from '@dbs/games-schema'
import {
  FraudRisk,
  PromocodeBonusType,
  PromocodeUsageStatus,
  TransactionType,
} from '@dbs/games-types'
import { gamesDb } from '@games/services'
import { and, eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { balanceService } from './balance'
import { gamesCache } from './cache'
import { fraudService } from './fraud'

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomChar(alphabet: string) {
  return alphabet[crypto.randomInt(alphabet.length)]
}

export enum PromocodeActivationOutcome {
  AppliedPayout = 'AppliedPayout',
  AppliedDeposit = 'AppliedDeposit',
  Blocked = 'Blocked',
  Expired = 'Expired',
  NotFound = 'NotFound',
  Inactive = 'Inactive',
  UsageExceeded = 'UsageExceeded',
  AlreadyUsed = 'AlreadyUsed',
  WrongUsage = 'WrongUsage',
  Failed = 'Failed',
}

type ActivationOutput =
  | {
      outcome: PromocodeActivationOutcome.AppliedPayout
      payout: number
      updatedBalance: BalanceSelect
      updatedPromocode: PromocodeSelect
      wageringRequired: number
    }
  | {
      outcome: PromocodeActivationOutcome.AppliedDeposit
      payout: number
      wageringRequired: number
    }
  | {
      outcome: PromocodeActivationOutcome.WrongUsage
      bonusType: PromocodeBonusType
    }
  | {
      outcome: Exclude<
        PromocodeActivationOutcome,
        | PromocodeActivationOutcome.AppliedPayout
        | PromocodeActivationOutcome.AppliedDeposit
        | PromocodeActivationOutcome.WrongUsage
      >
    }

export class PromocodeService {
  private logger: Logger

  constructor() {
    this.logger = loggerService.logger.child('Promocode')
  }

  generateOne({
    length = 10,
    alphabet = DEFAULT_ALPHABET,
  }: {
    length?: number
    alphabet?: string
  } = {}) {
    return Array.from({ length }, () => randomChar(alphabet)).join('')
  }

  generateMany({
    count,
    length = 10,
    alphabet = DEFAULT_ALPHABET,
  }: {
    count: number
    length?: number
    alphabet?: string
  }) {
    return Array.from({ length: count }, () =>
      this.generateOne({ length, alphabet }),
    )
  }

  async getPromocode(code: string) {
    const cached = await gamesCache.promocode.get(code)
    if (cached) return cached

    const promocode = await gamesDb.query.PromocodeTable.findFirst({
      where: eq(PromocodeTable.code, code),
    })

    if (!promocode) return null
    await gamesCache.promocode.set(code, promocode)
    return promocode
  }

  async isUsed(promocodeId: string, userId: string) {
    const usage = await gamesDb.query.PromocodeUsageTable.findFirst({
      where: and(
        eq(PromocodeUsageTable.promocodeId, promocodeId),
        eq(PromocodeUsageTable.userId, userId),
      ),
    })

    return Boolean(usage)
  }

  async applyPayout(payload: {
    userId: string
    code: string
  }): Promise<ActivationOutput> {
    const { userId, code } = payload

    try {
      const apply = await gamesDb.transaction(
        async (tx): Promise<ActivationOutput> => {
          const [balance] = await tx
            .select()
            .from(BalanceTable)
            .where(eq(BalanceTable.userId, userId))
            .for('update')

          if (!balance) {
            throw new Error('Balance not found (should not happen)')
          }

          const [promocode] = await tx
            .select()
            .from(PromocodeTable)
            .where(eq(PromocodeTable.code, code))
            .for('update')

          if (!promocode) {
            return { outcome: PromocodeActivationOutcome.NotFound }
          }

          if (promocode.bonusType !== PromocodeBonusType.Payout) {
            return {
              outcome: PromocodeActivationOutcome.WrongUsage,
              bonusType: promocode.bonusType,
            }
          }

          if (promocode.bonus.type !== PromocodeBonusType.Payout) {
            return {
              outcome: PromocodeActivationOutcome.WrongUsage,
              bonusType: promocode.bonus.type,
            }
          }

          if (promocode.userId && promocode.userId !== userId) {
            return { outcome: PromocodeActivationOutcome.NotFound }
          }

          if (await this.isUsed(promocode.id, userId)) {
            return { outcome: PromocodeActivationOutcome.AlreadyUsed }
          }

          if (!promocode.isActive) {
            return { outcome: PromocodeActivationOutcome.Inactive }
          }

          if (promocode.expiresAt) {
            const expiresAt = new Date(promocode.expiresAt)

            if (new Date() >= expiresAt) {
              return { outcome: PromocodeActivationOutcome.Expired }
            }
          }

          if (promocode.usages >= promocode.maxUsages) {
            return { outcome: PromocodeActivationOutcome.UsageExceeded }
          }

          const risk = await fraudService.actualizeRisk(userId)

          if (risk === FraudRisk.High || risk === FraudRisk.Medium) {
            return { outcome: PromocodeActivationOutcome.Blocked }
          }

          const wageringChange = Math.ceil(
            promocode.bonus.payout * (promocode.wageringMultiplier / 100),
          )

          const updatedPromocode = await tx
            .update(PromocodeTable)
            .set({ usages: promocode.usages + 1 })
            .where(eq(PromocodeTable.id, promocode.id))
            .returning()
            .then(takeFirstOrThrow)

          await tx.insert(PromocodeUsageTable).values({
            status: PromocodeUsageStatus.Applied,
            userId,
            promocodeId: promocode.id,
          })

          const transaction = await balanceService.createTransaction({
            tx,
            payload: {
              userId,
              type: TransactionType.Bonus,
              amount: promocode.bonus.payout,
            },
          })

          const updatedBalance = await balanceService.updateBalance({
            tx,
            balance,
            transaction,
            wageringChange,
          })

          return {
            outcome: PromocodeActivationOutcome.AppliedPayout,
            payout: promocode.bonus.payout,
            updatedBalance,
            updatedPromocode,
            wageringRequired: Math.ceil(
              promocode.bonus.payout * (promocode.wageringMultiplier / 100),
            ),
          }
        },
      )

      if (
        gamesCache.ready &&
        apply.outcome === PromocodeActivationOutcome.AppliedPayout
      ) {
        await gamesCache.balance.set(userId, apply.updatedBalance)
        await gamesCache.promocode.set(code, apply.updatedPromocode)
      }

      return apply
    } catch (error) {
      console.error(error)
      this.logger.error('Failed to apply Payout', error)
      return { outcome: PromocodeActivationOutcome.Failed }
    }
  }
}

export const promocodeService = new PromocodeService()
