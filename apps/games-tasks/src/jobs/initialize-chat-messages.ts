import { retry } from '@core/flow'
import { logger as coreLogger } from '@core/logger'
import { maintenanceCache } from '@games/redis'
import { chatService } from '@games/services'
import { CronJob } from 'cron'

const logger = coreLogger.child('InitializeChatMessagesJob')

export const initializeChatMessagesJob = CronJob.from({
  cronTime: '0 */1 * * *', // every 1 hour
  runOnInit: true,
  onTick: async () => {
    if (await maintenanceCache.isMaintenanceMode()) {
      logger.info('Skipped due to maintenance')
      return
    }

    const result = await retry({
      fn: () => chatService.initializeMessages(),
      maxAttempts: 10,
      delay: 1000,
    })

    if (result.succeeded) {
      logger.info('Chat messages initialized successfully')
    } else {
      logger.error('Failed to initialize chat messages', result.error)
      console.error(result.error)
    }
  },
})
