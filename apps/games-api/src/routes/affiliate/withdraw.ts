import { BadRequestException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { TransactionType } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import {
  affiliateService,
  balanceService,
  locks,
  sessionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const withdrawRoute = createRouter().post('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)

  const { updatedBalance, updatedReferrerBalance } = await locks.with(
    [locks.balance(userId), locks.referrerBalance(userId)],
    async () => {
      const balance = await balanceService.getBalance(userId)
      const referrerBalance = await affiliateService.getReferrerBalance(userId)

      if (!referrerBalance) {
        throw new BadRequestException({
          message: 'Вы не подключены к партнерской программе',
        })
      }

      if (referrerBalance.available < 1) {
        throw new BadRequestException({
          message: 'У вас нет доступных средств для вывода',
        })
      }

      const { updatedBalance, updatedReferrerBalance } =
        await gamesDb.transaction(async (tx) => {
          const transaction = await balanceService.createTransaction({
            tx,
            payload: {
              userId,
              type: TransactionType.Transfer,
              amount: referrerBalance.available,
            },
          })

          const updatedBalance = await balanceService.updateBalance({
            tx,
            balance,
            transaction,
          })

          await affiliateService.createReferrerWithdrawal({
            tx,
            referrerId: userId,
            amount: referrerBalance.available,
          })

          const updatedReferrerBalance =
            await affiliateService.updateReferrerBalance({
              tx,
              referrerId: userId,
              available: 0,
            })

          await gamesCaches.balance.set(userId, updatedBalance)
          await gamesCaches.referrerBalance.set(userId, updatedReferrerBalance)

          return { updatedBalance, updatedReferrerBalance }
        })

      return { updatedBalance, updatedReferrerBalance }
    },
  )

  return ctx.json({
    updatedBalance: updatedBalance.available,
    updatedReferrerBalance: updatedReferrerBalance.available,
  })
})
