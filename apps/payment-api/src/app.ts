import { logger } from 'hono/logger'
import { healthyRoute, readyRoute } from './health'
import { createRouter } from './hono'
import { bovapayRoute } from './routes/bovapay'

export const app = createRouter()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use('*', logger())
  .route('/bovapay', bovapayRoute)
