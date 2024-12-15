import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { DomainApp } from '@dbs/games-types-private'
import { domainService } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { healthyRoute, readyRoute } from '../routes/health'

export const baseApp = new Hono<HonoUwsEnv>()
  .use(
    '*',
    cors({
      origin: (origin) => {
        const matches = domainService.originMatches(origin, [
          DomainApp.GamesApp,
          DomainApp.ControlApp,
        ])

        return matches ? origin : null
      },
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use(requestIdMiddleware)
  .use(loggerMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
