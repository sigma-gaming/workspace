import { gamesDb } from '@dbs/games-db'
import {
  BudgetSelect,
  BudgetTable,
  TransactionTable,
  TransactionType,
} from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { logger } from '@libs/logger'
import { and, eq, gt, lte, sql } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class BudgetService {
  getBudget = async (): Promise<BudgetSelect> => {
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
  }

  increaseBudget = async (amount: number) => {
    try {
      await gamesCaches.budget.incField('available', amount)
    } catch (error) {
      logger.error('Failed to increase budget')
    }
  }

  syncBudget = async (force = false) => {
    const lock = await gamesCaches.budget.lock(10000)

    try {
      const budget = await this.getBudget()

      const currentSyncAt = new Date()
      const lastSyncAt = new Date(budget.lastSyncAt)

      const syncedRecently =
        currentSyncAt.getTime() - lastSyncAt.getTime() <= 1000 * 60 * 25 // 25 minutes

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

      await gamesCaches.budget.set(updatedBudget)
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
