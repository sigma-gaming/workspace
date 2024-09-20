import { retry } from '@core/flow'
import { logger } from '@core/logger'
import { chatService } from '@games/services'
import { CronJob } from 'cron'

export const initializeChatMessagesJob = CronJob.from({
  cronTime: '0 */1 * * *', // every 1 hour
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
      console.error(result.error)
      logger.error('Failed to initialize chat messages', result.error)
    }
  },
})
