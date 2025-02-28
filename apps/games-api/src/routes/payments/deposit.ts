import { tbValidator, TypeboxError } from '@core/server'
import { takeFirstOrThrow } from '@core/utils'
import { BalanceTable } from '@dbs/games-schema'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  ReferralAction,
  TransactionType,
} from '@dbs/games-types'
import { BalanceUpdate, gemInt, UpdateMode } from '@games/model'
import {
  affiliateService,
  balanceService,
  gamesCache,
  gamesDb,
  gamesPubsubs,
  sessionService,
} from '@games/services'
import { Type } from '@sinclair/typebox'
import { eq } from 'drizzle-orm'
import { createRouter } from '../../app/router'
import { limitByIp } from '../../middlewares/rate-limit'

const PayloadSchema = Type.Object({
  gemAmount: Type.Integer({
    minimum: gemInt(1),
  }),
  provider: Type.Enum(PaymentProvider),
  method: Type.Enum(DepositMethod),
  currency: Type.Enum(Currency),
})

export const depositRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  tbValidator('json', PayloadSchema, {
    gemAmount: {
      [TypeboxError.IntegerMinimum]: 'Минимальная сумма пополнения - 1 гем',
    },
    provider: {
      [TypeboxError.Union]: 'Неподдерживаемый провайдер',
    },
    method: {
      [TypeboxError.Union]: 'Неподдерживаемый метод оплаты',
    },
    currency: {
      [TypeboxError.Union]: 'Неподдерживаемая валюта',
    },
  }),
  async (ctx) => {
    const { userId, referrerId, referralCampaignId } =
      await sessionService.getHonoSession(ctx)
    const { gemAmount } = ctx.req.valid('json')

    const updatedBalance = await gamesDb.transaction(async (tx) => {
      const balance = await tx
        .select()
        .from(BalanceTable)
        .where(eq(BalanceTable.userId, userId))
        .for('update')
        .then(takeFirstOrThrow)

      const transaction = await balanceService.createTransaction({
        tx,
        payload: {
          userId,
          type: TransactionType.Deposit,
          amount: gemAmount,
        },
      })

      const updatedBalance = await balanceService.updateBalance({
        tx,
        balance,
        transaction,
        wageringChange: Math.ceil(gemAmount * 0.5),
      })

      await affiliateService.processReferralTransaction({
        tx,
        referralId: userId,
        referrerId,
        referralCampaignId,
        referralAction: ReferralAction.Deposit,
        amount: gemAmount,
      })

      await gamesCache.balance.set(userId, updatedBalance)

      return updatedBalance
    })

    const update: BalanceUpdate = {
      time: Date.now(),
      mode: UpdateMode.Optimized,
      available: updatedBalance.available,
    }

    gamesPubsubs.balanceUpdated.publish({
      userId,
      update,
    })

    return ctx.json({
      status: 'success',
      balance: update,
    })
  },
)
