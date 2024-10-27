import { logger } from 'hono/logger'
import { healthyRoute, readyRoute } from './health'
import { createRouter } from './hono'
import { exchangeRoute } from './routes/exchange'
import { logoutRoute } from './routes/logout'

export const app = createRouter()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use('*', logger())
  .route('/exchange', exchangeRoute)
  .route('/logout', logoutRoute)
