import { Logger, loggerService } from '@core/logger'
import { PromocodeTable, PromocodeUsageTable } from '@dbs/games-schema'
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
import { locks } from './locks'

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomChar(alphabet: string) {
  return alphabet[crypto.randomInt(alphabet.length)]
}

export enum PromocodeActivationResult {
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
      result: PromocodeActivationResult.AppliedPayout
      payout: number
      updatedBalance: number
      wageringRequired: number
    }
  | {
      result: PromocodeActivationResult.AppliedDeposit
      payout: number
      wageringRequired: number
    }
  | {
      result: PromocodeActivationResult.WrongUsage
      bonusType: PromocodeBonusType
    }
  | {
      result: Exclude<
        PromocodeActivationResult,
        | PromocodeActivationResult.AppliedPayout
        | PromocodeActivationResult.AppliedDeposit
        | PromocodeActivationResult.WrongUsage
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
      return await locks.with(
        [locks.promocode(code)],
        async (controller): Promise<ActivationOutput> => {
          const promocode = await this.getPromocode(code)

          if (!promocode) {
            return { result: PromocodeActivationResult.NotFound }
          }

          if (promocode.bonusType !== PromocodeBonusType.Payout) {
            return {
              result: PromocodeActivationResult.WrongUsage,
              bonusType: promocode.bonusType,
            }
          }

          if (promocode.bonus.type !== PromocodeBonusType.Payout) {
            return {
              result: PromocodeActivationResult.WrongUsage,
              bonusType: promocode.bonus.type,
            }
          }

          if (promocode.userId && promocode.userId !== userId) {
            return { result: PromocodeActivationResult.NotFound }
          }

          if (await this.isUsed(promocode.id, userId)) {
            return { result: PromocodeActivationResult.AlreadyUsed }
          }

          if (!promocode.isActive) {
            return { result: PromocodeActivationResult.Inactive }
          }

          if (promocode.expiresAt) {
            const expiresAt = new Date(promocode.expiresAt)

            if (new Date() >= expiresAt) {
              return { result: PromocodeActivationResult.Expired }
            }
          }

          if (promocode.usages >= promocode.maxUsages) {
            return { result: PromocodeActivationResult.UsageExceeded }
          }

          const risk = await fraudService.actualizeRisk(userId)

          if (risk === FraudRisk.High || risk === FraudRisk.Medium) {
            return { result: PromocodeActivationResult.Blocked }
          }

          await controller.add(locks.balance(userId))

          const balance = await balanceService.getBalance(userId)

          const wageringChange = Math.ceil(
            promocode.bonus.payout * (promocode.wageringMultiplier / 100),
          )

          const updatedBalance = await gamesDb.transaction(async (tx) => {
            if (promocode.bonus.type !== PromocodeBonusType.Payout) {
              return tx.rollback()
            }

            const [updatedPromocode] = await tx
              .update(PromocodeTable)
              .set({ usages: promocode.usages + 1 })
              .where(eq(PromocodeTable.id, promocode.id))
              .returning()

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

            await gamesCache.balance.set(userId, updatedBalance)
            await gamesCache.promocode.set(code, updatedPromocode)

            return updatedBalance
          })

          return {
            result: PromocodeActivationResult.AppliedPayout,
            payout: promocode.bonus.payout,
            updatedBalance: updatedBalance.available,
            wageringRequired: Math.ceil(
              promocode.bonus.payout * (promocode.wageringMultiplier / 100),
            ),
          }
        },
      )
    } catch (error) {
      console.error(error)
      this.logger.error('Failed to apply Payout', error)
      return { result: PromocodeActivationResult.Failed }
    }
  }
}

export const promocodeService = new PromocodeService()
