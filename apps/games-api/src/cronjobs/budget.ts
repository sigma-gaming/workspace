import { CronJob } from 'cron'
import { BudgetService } from '../services/budget'

export const syncBudgetJob = CronJob.from({
  cronTime: '*/5 * * * *',
  runOnInit: true,
  onTick: async () => {
    await BudgetService.syncBudget()
  }
})