import { createSingletonProxy } from '@core/di'
import { logger } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import { BudgetTable } from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import { singleton } from 'tsyringe-neo'

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
}

export const budgetService = createSingletonProxy(BudgetService)
