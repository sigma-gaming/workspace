import { cronJobRegistry } from '@core/cron-jobs'
import { initializeChatMessagesJob } from './initialize-chat-messages'
import { processReferrerPayoutsJob } from './process-referrer-payouts'
import { syncBudgetJob } from './sync-budget'

export function initializeCronJobs() {
  cronJobRegistry.register('initializeChatMessages', initializeChatMessagesJob)
  cronJobRegistry.register('syncBudget', syncBudgetJob)
  cronJobRegistry.register('processReferrerPayouts', processReferrerPayoutsJob)
  cronJobRegistry.start()
}
