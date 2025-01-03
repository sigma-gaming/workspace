import {
  HonoUwsEnv,
  inferEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

export const baseApp = new Hono<HonoUwsEnv>()
  .use(cors())
  .use(requestIdMiddleware)
  .use(loggerMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
