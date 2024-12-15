import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { Hono } from 'hono'
import { healthyRoute, readyRoute } from '../routes/health'

export const baseApp = new Hono<HonoUwsEnv>()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use(requestIdMiddleware)
  .use(loggerMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
