import { BadRequestException, InternalServerException } from '@core/exceptions'
import {
  ProfileTable,
  ReferrerPayoutTable,
  ReferrerTransactionTable,
} from '@dbs/games-schema'
import { ReferrerTransactionDetailed } from '@games/model'
import {
  affiliateService,
  gamesCache,
  gamesDb,
  sessionService,
} from '@games/services'
import { and, desc, eq, getTableColumns } from 'drizzle-orm'
import { createRouter } from '../../app/router'

export const getLastTransactionsRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const settings = await affiliateService.getReferrerSettings(userId)

  if (!settings) {
    throw new BadRequestException({
      message: 'Вы не подключены к партнерской программе',
    })
  }

  const cached = await gamesCache.lastReferrerTransactions.get(userId)

  if (cached) {
    return ctx.json(cached)
  }

  const payout = await gamesDb.query.ReferrerPayoutTable.findFirst({
    where: eq(ReferrerPayoutTable.referrerId, userId),
  })

  if (!payout) {
    const cause = new Error('Should have ReferrerPayout')
    throw new InternalServerException({ cause })
  }

  const transactions: ReferrerTransactionDetailed[] = await gamesDb
    .select({
      ...getTableColumns(ReferrerTransactionTable),
      referralName: ProfileTable.name,
      referralAvatar: ProfileTable.image,
      referralUsername: ProfileTable.username,
    })
    .from(ReferrerTransactionTable)
    .leftJoin(
      ProfileTable,
      eq(ReferrerTransactionTable.referralId, ProfileTable.userId),
    )
    .where(
      and(
        eq(ReferrerTransactionTable.referrerId, userId),
        eq(ReferrerTransactionTable.isProcessed, false),
      ),
    )
    .orderBy(desc(ReferrerTransactionTable.id))

  const totalAmount = transactions.reduce(
    (acc, transaction) => acc + transaction.amount,
    0,
  )

  await gamesCache.lastReferrerTransactions.set(userId, {
    transactions,
    totalAmount,
  })

  return ctx.json({ transactions, totalAmount })
})
