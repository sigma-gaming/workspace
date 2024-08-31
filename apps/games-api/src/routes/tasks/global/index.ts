import { Hono } from 'hono'
import { getStatusesRoute } from './get-statuses'
import { getTasksRoute } from './get-tasks'

export const tasksGlobalRouter = new Hono()
  .route('/getTasks', getTasksRoute)
  .route('/getStatuses', getStatusesRoute)
