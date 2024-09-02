import { cronJobRegistry } from '@core/cron-jobs'
import { initializeChatMessagesJob } from './initialize-chat-messages'

export function initializeCronJobs() {
  cronJobRegistry.register('initializeChatMessages', initializeChatMessagesJob)
  cronJobRegistry.start()
}
