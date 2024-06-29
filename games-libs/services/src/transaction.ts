import { gamesDb } from '@dbs/games-db'
import {
  TransactionInsert,
  TransactionSelect,
  TransactionTable,
} from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import { createSingletonProxy } from '@core/di'
import { desc, eq, sql } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class TransactionService {
  getLastTransaction = async (
    userId: string,
  ): Promise<TransactionSelect | null> => {
    const cached = await gamesCaches.lastTransaction.get(userId)

    if (cached) {
      return cached
    }

    const transaction = await this.getLastTransactionQuery.execute({ userId })

    if (transaction) {
      await gamesCaches.lastTransaction.set(userId, transaction)
    }

    return transaction ?? null
  }

  getTransaction = async (
    transactionId: string,
  ): Promise<TransactionSelect | null> => {
    const transaction = await gamesDb.query.TransactionTable.findFirst({
      where: eq(TransactionTable.id, transactionId),
    })

    return transaction ?? null
  }

  createTransaction = async (
    userId: string,
    payload: Required<Omit<TransactionInsert, 'id' | 'createdAt' | 'userId'>>,
  ): Promise<TransactionSelect> => {
    const [newTransaction] = await this.createTransactionQuery.execute({
      userId,
      ...payload,
    })

    await gamesCaches.lastTransaction.set(userId, newTransaction)

    return newTransaction
  }

  getLastTransactionQuery = gamesDb.query.TransactionTable.findFirst({
    where: eq(TransactionTable.userId, sql.placeholder('userId')),
    orderBy: desc(TransactionTable.createdAt),
  }).prepare('transactionQuery')

  createTransactionQuery = gamesDb
    .insert(TransactionTable)
    .values({
      userId: sql.placeholder('userId'),
      type: sql.placeholder('type'),
      game: sql.placeholder('game'),
      amount: sql.placeholder('amount'),
      openingBalance: sql.placeholder('openingBalance'),
      closingBalance: sql.placeholder('closingBalance'),
      totalBet: sql.placeholder('totalBet'),
      totalWon: sql.placeholder('totalWon'),
      totalLost: sql.placeholder('totalLost'),
      totalRTP: sql.placeholder('totalRTP'),
    })
    .returning()
    .prepare('createTransactionQuery')
}

export const transactionService = createSingletonProxy(TransactionService)
