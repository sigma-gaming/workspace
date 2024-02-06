import { Budget, Transactions, TransactionType } from '@libs/games-db-schema'
import { and, eq, gt, lte, sql } from 'drizzle-orm'
import { db } from '../shared/db'
import { logger } from '../shared/logger'
import { caches } from '../shared/redis'

export const getBudget = async (): Promise<Budget> => {
  const cached = await caches.budget.get()

  if (cached) {
    return cached
  }

  let budget = await db.query.Budget.findFirst()

  if (!budget) {
    logger.info('Budget not found in db, creating a new one')

    const created = await db.insert(Budget).values({}).returning()
    budget = created[0]
  }

  await caches.budget.set(budget)

  return budget
}

export async function increaseBudget(amount: number): Promise<void> {
  try {
    await caches.budget.incField('available', amount)
  } catch (error) {
    logger.error('Failed to increase budget')
  }
}

export async function syncBudget(force = false): Promise<void> {
  const lock = await caches.budget.lock(10000)

  try {
    const budget = await getBudget()

    const currentSyncAt = new Date()
    const lastSyncAt = new Date(budget.lastSyncAt)

    const syncedRecently =
      currentSyncAt.getTime() - lastSyncAt.getTime() <= 1000 * 60 * 25 // 25 minutes

    if (!force && syncedRecently) {
      return
    }

    const transactions = await db.query.Transactions.findMany({
      where: and(
        gt(Transactions.createdAt, lastSyncAt.toISOString()),
        lte(Transactions.createdAt, currentSyncAt.toISOString()),
      ),
    })

    const diff = transactions.reduce((acc, transaction) => {
      if (transaction.type === TransactionType.Deposit) {
        return acc + transaction.amount
      }

      if (transaction.type === TransactionType.Withdrawal) {
        return acc - transaction.amount
      }

      return acc
    }, 0)

    const [updatedBudget] = await db
      .update(Budget)
      .set({
        available: sql`${Budget.available} + ${diff}`,
        lastSyncAt: currentSyncAt.toISOString(),
      })
      .where(eq(Budget.id, 1))
      .returning()

    await caches.budget.set(updatedBudget)
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
