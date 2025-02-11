import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { DomainApp } from '@dbs/games-types-private'
import { SessionVariant } from '@games/model'
import { domainService } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from '../env'
import { sentryMiddleware } from '../middlewares/sentry'

type BaseEnv = HonoUwsEnv & {
  Variables: {
    sessionVariant?: SessionVariant
  }
}

export const baseApp = new Hono<BaseEnv>()
  .use(
    '*',
    cors({
      origin: (origin) => {
        const matches = domainService.originMatches(origin, [DomainApp.CoreApp])

        if (!matches) return null
        return origin
      },
      credentials: true,
      allowHeaders: [
        'content-type',
        'sentry-trace',
        'baggage',
        'x-bypass-rate-limit',
        'x-bypass-waf',
      ],
      maxAge: 86400,
    }),
  )
  .use(requestIdMiddleware)
  .use(loggerMiddleware)
  .use(sentryMiddleware({ enabled: env.isProd }))

export type AppEnv = inferEnv<typeof baseApp>
