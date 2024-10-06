import { BadRequestException, InternalServerException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import {
  ProfileTable,
  ReferrerPayoutTable,
  ReferrerTransactionTable,
} from '@dbs/games-schema'
import { ReferrerTransactionDetailed } from '@games/model'
import { gamesCaches } from '@games/redis'
import { affiliateService, sessionService } from '@games/services'
import { and, desc, eq, getTableColumns } from 'drizzle-orm'
import { createRouter } from '../../hono'

export const getLastTransactionsRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const settings = await affiliateService.getReferrerSettings(user.id)

  if (!settings) {
    throw new BadRequestException({
      message: 'Вы не подключены к партнерской программе',
    })
  }

  const cached = await gamesCaches.lastReferrerTransactions.get(user.id)

  if (cached) {
    return ctx.json(cached)
  }

  const payout = await gamesDb.query.ReferrerPayoutTable.findFirst({
    where: eq(ReferrerPayoutTable.referrerId, user.id),
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
        eq(ReferrerTransactionTable.referrerId, user.id),
        eq(ReferrerTransactionTable.isProcessed, false),
      ),
    )
    .orderBy(desc(ReferrerTransactionTable.id))

  const totalAmount = transactions.reduce(
    (acc, transaction) => acc + transaction.amount,
    0,
  )

  await gamesCaches.lastReferrerTransactions.set(user.id, {
    transactions,
    totalAmount,
  })

  return ctx.json({ transactions, totalAmount })
})
