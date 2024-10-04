import { retry } from '@core/flow'
import { logger as coreLogger } from '@core/logger'
import { maintenanceCache } from '@games/redis'
import { affiliateService } from '@games/services'
import { CronJob } from 'cron'

const logger = coreLogger.child('ProcessReferrerPayoutsJob')

export const processReferrerPayoutsJob = CronJob.from({
  cronTime: '0 */1 * * *', // every 1 hour
  runOnInit: true,
  onTick: async () => {
    if (await maintenanceCache.isMaintenanceMode()) {
      logger.info('Skipped due to maintenance')
      return
    }

    const result = await retry({
      fn: () => affiliateService.processReferrerPayouts(),
      maxAttempts: 10,
      delay: 1000,
    })

    if (result.succeeded) {
      logger.info('Referrer payouts processed successfully')
    } else {
      logger.error('Failed to process referrer payouts', result.error)
      console.error(result.error)
    }
  },
})
