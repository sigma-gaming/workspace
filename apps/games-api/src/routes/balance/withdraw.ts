import { BadRequestException } from '@core/exceptions'
import { BalanceTable } from '@dbs/games-schema'
import { FraudRisk, ReferralAction, TransactionType } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import {
  affiliateService,
  balanceService,
  fraudService,
  gamesCache,
  gamesDb,
  sessionService,
} from '@games/services'
import { eq } from 'drizzle-orm'
import { createRouter } from '../../hono'

export const withdrawRoute = createRouter().post('/', async (ctx) => {
  const { userId, referrerId, referralCampaignId } =
    await sessionService.getHonoSession(ctx)
  const amount = -1000_000
  const positiveAmount = Math.abs(amount)

  const risk = await fraudService.actualizeRisk(userId, { ip: ctx.env.ip })

  if (risk === FraudRisk.High) {
    throw new BadRequestException({
      message: 'Не удалось произвести вывод. Попробуйте позже',
    })
  }

  const updatedBalance = await gamesDb.transaction(async (tx) => {
    const [balance] = await tx
      .select()
      .from(BalanceTable)
      .where(eq(BalanceTable.userId, userId))
      .for('update')

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
