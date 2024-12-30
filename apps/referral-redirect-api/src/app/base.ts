import { inferEnv, loggerMiddleware, requestIdMiddleware } from '@core/server'
import { Hono } from 'hono'

export const baseApp = new Hono().use(requestIdMiddleware).use(loggerMiddleware)

export type AppEnv = inferEnv<typeof baseApp>
