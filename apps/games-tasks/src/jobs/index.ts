import { CronJobRegistry } from '@core/cron-jobs'
import { initializeChatMessagesJob } from './initialize-chat-messages'
import { processReferrerPayoutsJob } from './process-referrer-payouts'
import { syncBudgetJob } from './sync-budget'
import { updateCurrencyRatesJob } from './update-currency-rates'

const registry = new CronJobRegistry()

export function initializeCronJobs() {
  registry.register('initializeChatMessages', initializeChatMessagesJob)
  registry.register('syncBudget', syncBudgetJob)
  registry.register('processReferrerPayouts', processReferrerPayoutsJob)
  registry.register('updateCurrencyRates', updateCurrencyRatesJob)
  registry.start()
}
