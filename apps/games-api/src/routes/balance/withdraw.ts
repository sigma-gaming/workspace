import { BadRequestException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { FraudRisk, ReferralAction, TransactionType } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { gamesCaches } from '@games/redis'
import {
  affiliateService,
  balanceService,
  fraudService,
  locks,
  sessionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const withdrawRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const amount = -1000_000
  const positiveAmount = Math.abs(amount)

  return await locks.with([locks.balance(user.id)], async () => {
    const risk = await fraudService.actualizeRisk(user.id, { ctx })

    if (risk === FraudRisk.High) {
      throw new BadRequestException({
        message: 'Не удалось произвести вывод. Попробуйте позже',
      })
    }

    const balance = await balanceService.getBalance(user.id)

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
          userId: user.id,
        },
      })

      const updatedBalance = await balanceService.updateBalance({
        tx,
        balance,
        transaction,
      })

      await affiliateService.processReferralTransaction({
        tx,
        referral: user,
        referralAction: ReferralAction.Withdrawal,
        amount,
      })

      await gamesCaches.balance.set(user.id, updatedBalance)

      return updatedBalance
    })

    return ctx.json({
      status: 'success',
      updatedBalance: updatedBalance.available,
    })
  })
})
