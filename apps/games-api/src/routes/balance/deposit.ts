import { takeFirstOrThrow } from '@core/utils'
import { BalanceTable } from '@dbs/games-schema'
import { ReferralAction, TransactionType } from '@dbs/games-types'
import {
  affiliateService,
  balanceService,
  gamesCache,
  gamesDb,
  sessionService,
} from '@games/services'
import { eq } from 'drizzle-orm'
import { createRouter } from '../../hono'

export const depositRoute = createRouter().post('/', async (ctx) => {
  const { userId, referrerId, referralCampaignId } =
    await sessionService.getHonoSession(ctx)
  const amount = 1000_000

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

    return updatedBalance
  })

  if (gamesCache.ready) {
    await gamesCache.balance.set(userId, updatedBalance)
  }

  return ctx.json({
    status: 'success',
    updatedBalance: updatedBalance.available,
  })
})
