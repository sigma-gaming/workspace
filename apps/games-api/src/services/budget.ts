import { Budget } from '@libs/games-db'
import { rub, TransactionType } from '@libs/games-model'
import { budgetCache } from '../caches/budget'
import { prisma } from '../shared/db'
import { logger } from '../shared/logger'

export const getBudget = async (): Promise<Budget> => {
  const cached = await budgetCache.get()

  if (cached) {
    return cached
  }

  let budget = await prisma.budget.findFirst()

  if (!budget) {
    logger.info('Budget not found in db, creating a new one')

    budget = await prisma.budget.create({
      data: {
        available: rub(10000),
        unwantedLoss: rub(10000),
        maxLoss: rub(10000),
      },
    })
  }

  await budgetCache.set(budget)

  return budget
}

export async function increaseBudget(amount: number): Promise<void> {
  try {
    await budgetCache.incField('available', amount)
  } catch (error) {
    logger.error('Failed to increase budget')
  }
}

export async function syncBudget(force = false): Promise<void> {
  const lock = await budgetCache.lock(10000)

  try {
    const budget = await getBudget()

    const currentSyncAt = new Date()
    const lastSyncAt = new Date(budget.lastSyncAt)

    const syncedRecently =
      currentSyncAt.getTime() - lastSyncAt.getTime() <= 1000 * 60 * 25 // 25 minutes

    if (!force && syncedRecently) {
      return
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gt: lastSyncAt,
          lte: currentSyncAt,
        },
      },
    })

    const diff = transactions.reduce((acc, transaction) => {
      if (transaction.type === TransactionType.Deposit) {
        acc += transaction.amount
      }

      if (transaction.type === TransactionType.Withdrawal) {
        acc -= transaction.amount
      }

      return acc
    }, 0)

    const updatedBudget = await prisma.budget.update({
      where: { id: budget.id },
      data: {
        available: { increment: diff },
        lastSyncAt: currentSyncAt,
      },
    })

    await budgetCache.set(updatedBudget)
    logger.info('Budget synced successfully')
  } catch (error) {
    logger.error('Failed to sync budget')
    logger.error(error)
  } finally {
    await lock.release()
  }
}

export const BudgetService = {
  getBudget,
  increaseBudget,
  syncBudget,
}
