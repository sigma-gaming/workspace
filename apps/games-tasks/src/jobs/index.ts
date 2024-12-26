import { CronJobRegistry } from '@core/cron-jobs'
import { CronJob } from 'cron'
import { JobRegistry } from '../shared/jobs'
import { initializeChatMessagesJob } from './initialize-chat-messages'
import { processReferrerPayoutsJob } from './process-referrer-payouts'
import { processStaleDepositsJob } from './process-stale-deposits'
import { processStaleWithdrawalsJob } from './process-stale-withdrawals'
import { sendTransactionsMetricsJob } from './send-transactions-metrics'
import { syncBudgetJob } from './sync-budget'
import { updateCurrencyRatesJob } from './update-currency-rates'

const registry = new JobRegistry()

registry.register(initializeChatMessagesJob)
registry.register(syncBudgetJob)
registry.register(processReferrerPayoutsJob)
registry.register(updateCurrencyRatesJob)
registry.register(processStaleDepositsJob)
registry.register(processStaleWithdrawalsJob)
registry.register(sendTransactionsMetricsJob)

export function startCronJobs() {
  const cronRegistry = new CronJobRegistry()

  for (const { name, cronTime, runOnInit, onTick } of registry.getAll()) {
    const job = CronJob.from({
      cronTime,
      runOnInit,
      onTick,
    })

    cronRegistry.register({ name, job })
  }

  cronRegistry.start()
}

export function executeJob(name: string) {
  const job = registry.getJob(name)

  if (!job) {
    throw new Error(`Job "${name}" not found`)
  }

  return job.onTick()
}
