import { cronJobRegistry } from '@core/cron-jobs'
import { retry } from '@core/flow'
import { logger } from '@core/logger'
import { chatService } from '@games/services'
import { createCronJob } from './instrument'

const NAME = 'initializeChatMessages'

cronJobRegistry.register(
  NAME,
  createCronJob(NAME, {
    cronTime: '0 */1 * * *', // every 6 hours
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
        console.log(result.error)
        logger.error('Failed to initialize chat messages', result.error)
      }
    },
  }),
)
