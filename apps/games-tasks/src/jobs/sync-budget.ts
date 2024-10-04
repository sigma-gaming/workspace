import { retry } from '@core/flow'
import { logger as coreLogger } from '@core/logger'
import { maintenanceCache } from '@games/redis'
import { budgetService } from '@games/services'
import { CronJob } from 'cron'

const logger = coreLogger.child('SyncBudgetJob')

export const syncBudgetJob = CronJob.from({
  cronTime: '*/5 * * * *', // every 5 minutes
  runOnInit: true,
  onTick: async () => {
    if (await maintenanceCache.isMaintenanceMode()) {
      logger.info('Skipped due to maintenance')
      return
    }

    const result = await retry({
      fn: () => budgetService.sync(),
      maxAttempts: 10,
      delay: 1000,
    })

    if (result.succeeded) {
      logger.info('Budget synced successfully')
    } else {
      logger.error('Failed to sync budget', result.error)
      console.error(result.error)
    }
  },
})
