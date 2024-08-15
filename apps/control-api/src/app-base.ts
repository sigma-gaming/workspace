import { HonoUwsEnv } from '@core/hono-uws'
import { env } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export const baseApp = new Hono<HonoUwsEnv>().use('*', logger()).use(
  '*',
  cors({
    origin: env.controlApp.url,
    credentials: true,
    allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
  }),
)
