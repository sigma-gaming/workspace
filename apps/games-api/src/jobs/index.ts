import './initialize-chat-messages'
import { cronJobRegistry } from '@core/cron-jobs'

export function initializeCronJobs() {
  cronJobRegistry.start()
}
