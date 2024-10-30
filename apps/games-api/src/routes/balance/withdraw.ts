import { BadRequestException } from '@core/exceptions'
import { FraudRisk, ReferralAction, TransactionType } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import {
  affiliateService,
  balanceService,
  fraudService,
  gamesCache,
  gamesDb,
  locks,
  sessionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const withdrawRoute = createRouter().post('/', async (ctx) => {
  const { userId, referrerId, referralCampaignId } =
    await sessionService.getHonoSession(ctx)
  const amount = -1000_000
  const positiveAmount = Math.abs(amount)

  return await locks.with([locks.balance(userId)], async () => {
    const risk = await fraudService.actualizeRisk(userId, { ip: ctx.env.ip })

    if (risk === FraudRisk.High) {
      throw new BadRequestException({
        message: 'Не удалось произвести вывод. Попробуйте позже',
      })
    }

    const balance = await balanceService.getBalance(userId)

    if (balance.available < positiveAmount) {
      throw new BadRequestException({
        message: 'Недостаточно гемов',
      })
    }

    if (balance.wageringRequired > 0) {
      throw new BadRequestException({
        message: `Нужно отыграть еще ${formatGem(gemFloat(balance.wageringRequired))}g`,
      })
    }

    const updatedBalance = await gamesDb.transaction(async (tx) => {
      const transaction = await balanceService.createTransaction({
        tx,
        payload: {
          type: TransactionType.Withdrawal,
          amount,
          userId,
        },
      })

      const updatedBalance = await balanceService.updateBalance({
        tx,
        balance,
        transaction,
      })

      await affiliateService.processReferralTransaction({
        tx,
        referralId: userId,
        referrerId,
        referralCampaignId,
        referralAction: ReferralAction.Withdrawal,
        amount,
      })

      await gamesCache.balance.set(userId, updatedBalance)

      return updatedBalance
    })

    return ctx.json({
      status: 'success',
      updatedBalance: updatedBalance.available,
    })
  })
})
