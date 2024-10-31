import { logger } from '@core/logger'
import { BudgetTable } from '@dbs/games-schema'
import { gamesDb } from '@games/services'
import { gamesCache } from './cache'

export class BudgetService {
  private async queryBudget() {
    const budget = await gamesDb.query.BudgetTable.findFirst()
    if (budget) return budget

    logger.info('Budget not found in db, creating a new one')

    const [created] = await gamesDb
      .insert(BudgetTable)
      .values({ id: 1 })
      .returning()

    return created
  }

  getBudget = async () => {
    if (!gamesCache.ready) {
      return await this.queryBudget()
    }

    const cached = await gamesCache.budget.get()
    if (cached) return cached

    const budget = await this.queryBudget()
    await gamesCache.budget.set(budget)

    return budget
  }

  getAvailable = async (): Promise<number> => {
    if (!gamesCache.ready) {
      const budget = await this.getBudget()
      return budget.available
    }

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
    const { lastSyncAt } = await this.queryBudget()
    return new Date(lastSyncAt)
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
