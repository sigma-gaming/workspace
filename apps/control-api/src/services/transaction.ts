import {
  Transaction,
  TransactionInsert,
  Transactions,
} from '@libs/games-db-schema'
import { desc, eq } from 'drizzle-orm'
import { caches } from '../shared/cache'
import { db } from '../shared/db'

export const getLastTransaction = async (
  userId: string,
): Promise<Transaction | null> => {
  const cached = await caches.lastTransaction.get(userId)

  if (cached) {
    return cached
  }

  const transaction = await db.query.Transactions.findFirst({
    where: eq(Transactions.userId, userId),
    orderBy: desc(Transactions.createdAt),
  })

  if (transaction) {
    await caches.lastTransaction.set(userId, transaction)
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

  await caches.lastTransaction.set(userId, newTransaction)

  return newTransaction
}

export const TransactionService = {
  getLastTransaction,
  createTransaction,
}
