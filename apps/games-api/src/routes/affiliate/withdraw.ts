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
  const session = ctx.get('session')
  const user = sessionService.getUser(session)

  const { updatedBalance, updatedReferrerBalance } = await locks.with(
    [locks.balance(user.id), locks.referrerBalance(user.id)],
    async () => {
      const balance = await balanceService.getBalance(user.id)
      const referrerBalance = await affiliateService.getReferrerBalance(user.id)

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
              userId: user.id,
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
            referrerId: user.id,
            amount: referrerBalance.available,
          })

          const updatedReferrerBalance =
            await affiliateService.updateReferrerBalance({
              tx,
              referrerId: user.id,
              available: 0,
            })

          await gamesCaches.balance.set(user.id, updatedBalance)
          await gamesCaches.referrerBalance.set(user.id, updatedReferrerBalance)

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
