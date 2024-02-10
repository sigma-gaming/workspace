import { gamesDb } from '@games/db'
import { Transaction, TransactionInsert, Transactions } from '@games/db-schema'
import { gamesCaches } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { desc, eq, sql } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class TransactionService {
  getLastTransaction = async (userId: string): Promise<Transaction | null> => {
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
  ): Promise<Transaction | null> => {
    const transaction = await gamesDb.query.Transactions.findFirst({
      where: eq(Transactions.id, transactionId),
    })

    return transaction ?? null
  }

  createTransaction = async (
    userId: string,
    payload: Required<Omit<TransactionInsert, 'id' | 'createdAt' | 'userId'>>,
  ): Promise<Transaction> => {
    const [newTransaction] = await this.createTransactionQuery.execute({
      userId,
      ...payload,
    })

    await gamesCaches.lastTransaction.set(userId, newTransaction)

    return newTransaction
  }

  getLastTransactionQuery = gamesDb.query.Transactions.findFirst({
    where: eq(Transactions.userId, sql.placeholder('userId')),
    orderBy: desc(Transactions.createdAt),
  }).prepare('transactionQuery')

  createTransactionQuery = gamesDb
    .insert(Transactions)
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
