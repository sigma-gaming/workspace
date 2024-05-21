import { budgetService } from '@games/services'
import { CronJob } from 'cron'

export const syncBudgetJob = CronJob.from({
  cronTime: '*/5 * * * *',
  start: false,
  onTick: async () => {
    await budgetService.syncBudget()
  },
})
