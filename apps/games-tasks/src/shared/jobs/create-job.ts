import { retry } from '@core/flow'
import { logger as coreLogger } from '@core/logger'
import { maintenanceService } from '@games/services'
import { CronJob } from 'cron'

export function createJob({
  name,
  cronTime,
  runOnInit = true,
  maxAttempts = 5,
  delay = 1000,
  handler,
}: {
  name: string
  cronTime: string
  runOnInit?: boolean
  maxAttempts?: number
  delay?: number
  handler: () => Promise<void>
}) {
  const logger = coreLogger.child('Jobs').child(name)

  const job = CronJob.from({
    cronTime,
    runOnInit,
    onTick: async () => {
      const backgroundJobsEnabled =
        await maintenanceService.areBackgroundJobsEnabled()

      if (!backgroundJobsEnabled) {
        logger.info('Background jobs disabled, skipping')
        return
      }

      const result = await retry({
        fn: handler,
        maxAttempts,
        delay,
      })

      if (result.succeeded) {
        logger.info('Job executed successfully')
      } else {
        logger.error('Failed to execute job')
        logger.error(result.error)
      }
    },
  })

  return { name, job }
}
