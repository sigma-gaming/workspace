import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from '../env'
import { sessionMiddleware } from '../middlewares/session'
import { healthyRoute, readyRoute } from '../routes/health'

export const baseApp = new Hono<HonoUwsEnv>()
  .use(
    '*',
    cors({
      origin: env.controlApp.url,
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use(requestIdMiddleware)
  .use(loggerMiddleware)
  .use(sessionMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
