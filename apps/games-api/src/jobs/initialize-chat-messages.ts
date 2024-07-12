import { cronJobRegistry } from '@core/cron-jobs'
import { retry } from '@core/flow'
import { logger } from '@core/logger'
import { chatService } from '@games/services'
import { CronJob } from 'cron'

cronJobRegistry.register(
  'initializeChatMessages',
  // every 6 hours
  CronJob.from({
    cronTime: '0 */6 * * *',
    runOnInit: true,
    onTick: async () => {
      const result = await retry({
        fn: () => chatService.initializeMessages(),
        maxAttempts: 10,
        delay: 1000,
      })

      if (result.succeeded) {
        logger.info('Chat messages initialized successfully')
      } else {
        logger.error('Failed to initialize chat messages', result.error)
      }
    },
  }),
)
