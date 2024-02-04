import {
  Transaction,
  TransactionInsert,
  Transactions,
} from '@libs/games-db-schema'
import { desc, eq, sql } from 'drizzle-orm'
import { caches } from '../shared/cache'
import { db } from '../shared/db'

const getLastTransactionQuery = db.query.Transactions.findFirst({
  where: eq(Transactions.userId, sql.placeholder('userId')),
  orderBy: desc(Transactions.createdAt),
}).prepare('transactionQuery')

const createTransactionQuery = db
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

export const getLastTransaction = async (
  userId: string,
): Promise<Transaction | null> => {
  const cached = await caches.lastTransaction.get(userId)

  if (cached) {
    return cached
  }

  const transaction = await getLastTransactionQuery.execute({ userId })

  if (transaction) {
    await caches.lastTransaction.set(userId, transaction)
  }

  return transaction ?? null
}

export const createTransaction = async (
  userId: string,
  payload: Required<Omit<TransactionInsert, 'id' | 'createdAt' | 'userId'>>,
): Promise<Transaction> => {
  const [newTransaction] = await createTransactionQuery.execute({
    userId,
    ...payload,
  })

  await caches.lastTransaction.set(userId, newTransaction)

  return newTransaction
}

export const TransactionService = {
  getLastTransaction,
  createTransaction,
}
