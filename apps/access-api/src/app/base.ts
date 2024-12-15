import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from '../env'
import { healthyRoute, readyRoute } from '../routes/health'

export const baseApp = new Hono<HonoUwsEnv>()
  .use(
    '*',
    cors({
      origin: [env.gamesApp.url, env.controlApp.url],
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use(requestIdMiddleware)
  .use(loggerMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
