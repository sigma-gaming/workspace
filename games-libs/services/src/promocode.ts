import { createSingletonProxy } from '@core/di'
import { Logger, LoggerService } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import { PromocodeTable, PromocodeUsageTable } from '@dbs/games-schema'
import {
  FraudRisk,
  PromocodeBonusType,
  PromocodeUsageStatus,
  TransactionType,
} from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import { and, eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { FraudService } from './fraud'
import { transactionService } from './transaction'

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

@singleton()
export class PromocodeService {
  private logger: Logger

  constructor(
    loggerService: LoggerService,
    private fraudService: FraudService,
  ) {
    this.logger = loggerService.logger.child('Promocode')
  }

  async getPromocode(code: string) {
    const cached = await gamesCaches.promocode.get(code)
    if (cached) return cached

    const promocode = await gamesDb.query.PromocodeTable.findFirst({
      where: eq(PromocodeTable.code, code),
    })

    if (!promocode) return null
    await gamesCaches.promocode.set(code, promocode)
    return promocode
  }

  async isUsed(code: string, userId: string) {
    const usage = await gamesDb.query.PromocodeUsageTable.findFirst({
      where: and(
        eq(PromocodeUsageTable.promocodeId, code),
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

    const locks = [await gamesCaches.promocode.lock(code, 5000)]

    try {
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

      if (await this.isUsed(code, userId)) {
        return { result: PromocodeActivationResult.AlreadyUsed }
      }

      const risk = await this.fraudService.actualizeRisk(userId)

      if (risk === FraudRisk.High || risk === FraudRisk.Medium) {
        return { result: PromocodeActivationResult.Blocked }
      }

      locks.push(await transactionService.lock(userId, 5000))

      const lastTransaction =
        await transactionService.getLastTransaction(userId)

      const bonusWageringAmount = Math.ceil(
        promocode.bonus.payout * (promocode.wageringMultiplier / 100),
      )

      const { transaction, updatedPromocode } = await gamesDb.transaction(
        async (tx) => {
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

          const [transaction] = await transactionService.createTransaction({
            tx,
            payload: transactionService.generateTransaction(lastTransaction, {
              userId,
              type: TransactionType.Bonus,
              amount: promocode.bonus.payout,
              wageringIncrease: bonusWageringAmount,
            }),
          })

          return { transaction, updatedPromocode }
        },
      )

      await gamesCaches.lastTransaction.set(userId, transaction)
      await gamesCaches.promocode.set(code, updatedPromocode)

      return {
        result: PromocodeActivationResult.AppliedPayout,
        payout: promocode.bonus.payout,
        wageringRequired: Math.ceil(
          promocode.bonus.payout * (promocode.wageringMultiplier / 100),
        ),
      }
    } catch (error) {
      this.logger.error('Failed to apply Payout', error)
      return { result: PromocodeActivationResult.Failed }
    } finally {
      await Promise.all(locks.map((lock) => lock.release()))
    }
  }
}

export const promocodeService = createSingletonProxy(PromocodeService)
