import { gamesDb } from '@dbs/games-db'
import { ReferralAction, TransactionType } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import {
  affiliateService,
  balanceService,
  locks,
  sessionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const depositRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const amount = 1000_000

  return locks.with([locks.balance(user.id)], async () => {
    const balance = await balanceService.getBalance(user.id)

    const updatedBalance = await gamesDb.transaction(async (tx) => {
      const transaction = await balanceService.createTransaction({
        tx,
        payload: {
          userId: user.id,
          type: TransactionType.Deposit,
          amount,
        },
      })

      const updatedBalance = await balanceService.updateBalance({
        tx,
        balance,
        transaction,
        wageringChange: Math.ceil(amount * 0.5),
      })

      await affiliateService.processReferralTransaction({
        tx,
        referral: user,
        referralAction: ReferralAction.Deposit,
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
