import { inferEnv, loggerMiddleware, requestIdMiddleware } from '@core/server'
import { DomainApp } from '@dbs/games-types-private'
import { domainService } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sessionMiddleware } from '../middlewares/session'

export const baseApp = new Hono()
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
      maxAge: 86400,
    }),
  )
  .use(requestIdMiddleware)
  .use(loggerMiddleware)
  .use(sessionMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
