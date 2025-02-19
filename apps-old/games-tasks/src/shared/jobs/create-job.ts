import { retry } from '@core/flow'
import { Logger, logger as coreLogger } from '@core/logger'
import { maintenanceService } from '@games/services'

export type Job = {
  name: string
  enabled: boolean
  cronTime: string
  runOnInit: boolean
  onTick: () => Promise<void>
}

export function createJob({
  name,
  enabled = true,
  cronTime,
  runOnInit = true,
  maxAttempts = 5,
  delay = 1000,
  handler,
}: {
  name: string
  enabled?: boolean
  cronTime: string
  runOnInit?: boolean
  maxAttempts?: number
  delay?: number
  handler: (context: { logger: Logger }) => Promise<void>
}): Job {
  const logger = coreLogger.child('Jobs').child(name)

  const onTick = async () => {
    const backgroundJobsEnabled =
      await maintenanceService.areBackgroundJobsEnabled()

    if (!backgroundJobsEnabled) {
      logger.info('Background jobs disabled, skipping')
      return
    }

    const result = await retry({
      fn: () => handler({ logger }),
      maxAttempts,
      delay,
    })

    if (result.succeeded) {
      logger.info('Job executed successfully')
    } else {
      logger.error('Failed to execute job')
      logger.error(result.error)
    }
  }

  return { name, enabled, cronTime, runOnInit, onTick }
}
