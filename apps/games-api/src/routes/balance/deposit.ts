import { ReferralAction, TransactionType } from '@dbs/games-types'
import {
  affiliateService,
  balanceService,
  gamesCache,
  gamesDb,
  locks,
  sessionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const depositRoute = createRouter().post('/', async (ctx) => {
  const { userId, referrerId, referralCampaignId } =
    await sessionService.getHonoSession(ctx)
  const amount = 1000_000

  return locks.with([locks.balance(userId)], async () => {
    const balance = await balanceService.getBalance(userId)

    const updatedBalance = await gamesDb.transaction(async (tx) => {
      const transaction = await balanceService.createTransaction({
        tx,
        payload: {
          userId,
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
        referralId: userId,
        referrerId,
        referralCampaignId,
        referralAction: ReferralAction.Deposit,
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
