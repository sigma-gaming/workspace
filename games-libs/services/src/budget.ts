import { createSingletonProxy } from '@core/di'
import { logger } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import {
  BudgetTable,
  TransactionTable,
  TransactionType,
} from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import { and, eq, gt, lte, sql } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class BudgetService {
  getBudget = async () => {
    const lock = await gamesCaches.budget.lock(3000)

    try {
      const cached = await gamesCaches.budget.get()

      if (cached) {
        return cached
      }

      let budget = await gamesDb.query.BudgetTable.findFirst()

      if (!budget) {
        logger.info('Budget not found in db, creating a new one')

        const created = await gamesDb.insert(BudgetTable).values({}).returning()
        budget = created[0]
      }

      await gamesCaches.budget.set(budget)
      return budget
    } finally {
      await lock.release()
    }
  }

  getAvailable = async (): Promise<number> => {
    const cached = await gamesCaches.budgetAvailable.get()
    if (cached) return cached
    const budget = await this.getBudget()
    await gamesCaches.budgetAvailable.set(budget.available)
    return budget.available
  }

  getUnwantedLoss = async (): Promise<number> => {
    const cached = await gamesCaches.budgetUnwantedLoss.get()
    if (cached) return cached
    const budget = await this.getBudget()
    await gamesCaches.budgetUnwantedLoss.set(budget.unwantedLoss)
    return budget.unwantedLoss
  }

  getMaxLoss = async (): Promise<number> => {
    const cached = await gamesCaches.budgetMaxLoss.get()
    if (cached) return cached
    const budget = await this.getBudget()
    await gamesCaches.budgetMaxLoss.set(budget.maxLoss)
    return budget.maxLoss
  }

  getSyncedAt = async (): Promise<Date> => {
    const cached = await gamesCaches.budgetSyncedAt.get()
    if (cached) return new Date(cached)
    const budget = await this.getBudget()
    if (!budget) return new Date()
    await gamesCaches.budgetSyncedAt.set(budget.lastSyncAt)
    return new Date(budget.lastSyncAt)
  }

  increaseAvailable = async (amount: number) => {
    try {
      await gamesCaches.budgetAvailable.incrBy(amount)
    } catch (error) {
      logger.error('Failed to increase budget')
    }
  }

  decreaseAvailable = async (amount: number) => {
    try {
      await gamesCaches.budgetAvailable.decrBy(amount)
    } catch (error) {
      logger.error('Failed to decrease budget')
    }
  }

  syncBudget = async (force = false) => {
    const lock = await gamesCaches.budgetAvailable.lock(10000)

    try {
      const currentSyncAt = new Date()
      const lastSyncAt = await this.getSyncedAt()

      const syncedRecently =
        currentSyncAt.getTime() - lastSyncAt.getTime() <= 1000 * 60 * 30 // 30 minutes

      if (!force && syncedRecently) {
        return
      }

      const transactions = await gamesDb.query.TransactionTable.findMany({
        where: and(
          gt(TransactionTable.createdAt, lastSyncAt.toISOString()),
          lte(TransactionTable.createdAt, currentSyncAt.toISOString()),
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

      const [updatedBudget] = await gamesDb
        .update(BudgetTable)
        .set({
          available: sql`${BudgetTable.available} + ${diff}`,
          lastSyncAt: currentSyncAt.toISOString(),
        })
        .where(eq(BudgetTable.id, 1))
        .returning()

      await gamesCaches.budgetAvailable.set(updatedBudget.available)
      await gamesCaches.budgetSyncedAt.set(updatedBudget.lastSyncAt)
      logger.info('Budget synced successfully')
    } catch (error) {
      logger.error('Failed to sync budget')
      logger.error(error)
    } finally {
      await lock.release()
    }
  }
}

export const budgetService = createSingletonProxy(BudgetService)
