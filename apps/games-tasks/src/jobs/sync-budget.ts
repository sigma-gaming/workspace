import { retry } from '@core/flow'
import { logger } from '@core/logger'
import { budgetService } from '@games/services'
import { CronJob } from 'cron'

export const syncBudgetJob = CronJob.from({
  cronTime: '*/5 * * * *', // every 5 minutes
  runOnInit: true,
  onTick: async () => {
    const result = await retry({
      fn: () => budgetService.sync(),
      maxAttempts: 10,
      delay: 1000,
    })

    if (result.succeeded) {
      logger.info('Budget synced successfully')
    } else {
      console.error(result.error)
      logger.error('Failed to sync budget', result.error)
    }
  },
})
