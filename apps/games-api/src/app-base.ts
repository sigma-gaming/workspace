import { env } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { sentryMiddleware } from './shared/sentry'

export const baseApp = new Hono()
  .use('*', sentryMiddleware)
  .use('*', logger())
  .use(
    '*',
    cors({
      origin: [env.gamesApp.url, env.controlApp.url],
      credentials: true,
      allowHeaders: ['sentry-trace', 'baggage'],
    }),
  )
