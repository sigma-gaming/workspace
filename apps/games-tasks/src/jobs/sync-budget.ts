import { budgetService } from '@games/services'
import { createJob } from '../shared/jobs'

export const syncBudgetJob = createJob({
  name: 'SyncBudget',
  cronTime: '*/5 * * * *', // every 5 minutes
  handler: () => budgetService.sync(),
})
