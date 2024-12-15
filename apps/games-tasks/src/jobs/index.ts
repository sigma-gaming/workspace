import { CronJobRegistry } from '@core/cron-jobs'
import { initializeChatMessagesJob } from './initialize-chat-messages'
import { processReferrerPayoutsJob } from './process-referrer-payouts'
import { processStaleDepositsJob } from './process-stale-deposits'
import { processStaleWithdrawalsJob } from './process-stale-withdrawals'
import { syncBudgetJob } from './sync-budget'
import { updateCurrencyRatesJob } from './update-currency-rates'

const registry = new CronJobRegistry()

export function initializeCronJobs() {
  registry.register(initializeChatMessagesJob)
  registry.register(syncBudgetJob)
  registry.register(processReferrerPayoutsJob)
  registry.register(updateCurrencyRatesJob)
  registry.register(processStaleDepositsJob)
  registry.register(processStaleWithdrawalsJob)

  registry.start()
}
