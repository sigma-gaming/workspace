import { createRouter } from '../../../app/router'
import { claimRewardRoute } from './claim-reward'
import { completeRoute } from './complete'
import { getStatusesRoute } from './get-statuses'
import { getTasksRoute } from './get-tasks'

export const tasksGlobalRouter = createRouter()
  .route('/getTasks', getTasksRoute)
  .route('/getStatuses', getStatusesRoute)
  .route('/complete', completeRoute)
  .route('/claimReward', claimRewardRoute)
