import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { SessionVariant } from '@games/model'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from '../env'
import { sentryMiddleware } from '../middlewares/sentry'
import { healthyRoute, readyRoute } from '../routes/health'

type BaseEnv = HonoUwsEnv & {
  Variables: {
    sessionVariant?: SessionVariant
  }
}

export const baseApp = new Hono<BaseEnv>()
  .use(
    '*',
    cors({
      origin: env.gamesApp.url,
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use(requestIdMiddleware)
  .use(loggerMiddleware)
  .use(sentryMiddleware({ enabled: env.isProd }))

export type AppEnv = inferEnv<typeof baseApp>
