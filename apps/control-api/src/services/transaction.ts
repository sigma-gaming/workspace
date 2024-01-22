import { Prisma, Transaction } from '@libs/games-db'
import { lastTransactionCache } from '../caches/transaction'
import { prisma } from '../shared/db'

export const getLastTransaction = async (
  userId: string,
): Promise<Transaction | null> => {
  const cached = await lastTransactionCache.get(userId)

  if (cached) {
    return cached
  }

  const transaction = await prisma.transaction.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (transaction) {
    await lastTransactionCache.set(userId, transaction)
  }

  return transaction
}

export const createTransaction = async (
  userId: string,
  payload: Omit<Prisma.TransactionUncheckedCreateInput, 'userId'>,
): Promise<Transaction> => {
  const newTransaction = await prisma.transaction.create({
    data: { userId, ...payload },
  })

  await lastTransactionCache.set(userId, newTransaction)

  return newTransaction
}

export const TransactionService = {
  getLastTransaction,
  createTransaction,
}
