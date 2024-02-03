import {
  Transaction,
  TransactionInsert,
  Transactions,
} from '@libs/games-db-schema'
import { desc, eq } from 'drizzle-orm'
import { lastTransactionCache } from '../caches/transaction'
import { db } from '../shared/db'

export const getLastTransaction = async (
  userId: string,
): Promise<Transaction | null> => {
  const cached = await lastTransactionCache.get(userId)

  if (cached) {
    return cached
  }

  const transaction = await db.query.Transactions.findFirst({
    where: eq(Transactions.userId, userId),
    orderBy: desc(Transactions.createdAt),
  })

  if (transaction) {
    await lastTransactionCache.set(userId, transaction)
  }

  return transaction ?? null
}

export const createTransaction = async (
  userId: string,
  payload: Omit<TransactionInsert, 'userId'>,
): Promise<Transaction> => {
  const [newTransaction] = await db
    .insert(Transactions)
    .values({ userId, ...payload })
    .returning()

  await lastTransactionCache.set(userId, newTransaction)

  return newTransaction
}

export const TransactionService = {
  getLastTransaction,
  createTransaction,
}
