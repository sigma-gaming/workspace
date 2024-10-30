import { logger } from '@core/logger'
import { BudgetTable } from '@dbs/games-schema'
import { gamesDb } from '@games/services'
import { gamesCache } from './cache'
import { locks } from './locks'

export class BudgetService {
  getBudget = async () => {
    return await locks.with([locks.budget()], async () => {
      const cached = await gamesCache.budget.get()

      if (cached) {
        return cached
      }

      let budget = await gamesDb.query.BudgetTable.findFirst()

      if (!budget) {
        logger.info('Budget not found in db, creating a new one')

        const created = await gamesDb.insert(BudgetTable).values({}).returning()
        budget = created[0]
      }

      await gamesCache.budget.set(budget)
      return budget
    })
  }

  getAvailable = async (): Promise<number> => {
    const cached = await gamesCache.budgetAvailable.get()
    if (cached) return cached
    const budget = await this.getBudget()
    await gamesCache.budgetAvailable.set(budget.available)
    return budget.available
  }

  sync = async () => {
    const available = await this.getAvailable()

    await gamesDb.update(BudgetTable).set({
      lastSyncAt: new Date().toISOString(),
      available,
    })
  }

  getSyncedAt = async (): Promise<Date> => {
    const cached = await gamesCache.budgetSyncedAt.get()
    if (cached) return new Date(cached)
    const budget = await this.getBudget()
    if (!budget) return new Date()
    await gamesCache.budgetSyncedAt.set(budget.lastSyncAt)
    return new Date(budget.lastSyncAt)
  }

  increaseAvailable = async (amount: number) => {
    try {
      await gamesCache.budgetAvailable.incrBy(amount)
    } catch (error) {
      logger.error('Failed to increase budget')
    }
  }

  decreaseAvailable = async (amount: number) => {
    try {
      await gamesCache.budgetAvailable.decrBy(amount)
    } catch (error) {
      logger.error('Failed to decrease budget')
    }
  }

  changeAvailable = async (amount: number) => {
    if (amount > 0) {
      await this.increaseAvailable(amount)
    } else {
      await this.decreaseAvailable(Math.abs(amount))
    }
  }
}

export const budgetService = new BudgetService()
