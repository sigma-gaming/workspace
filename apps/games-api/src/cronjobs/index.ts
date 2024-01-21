import { syncBudgetJob } from './budget'

export const CronJobs = [
  {
    name: 'syncBudget',
    instance: syncBudgetJob,
  },
]
