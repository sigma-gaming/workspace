import { createNodeWebSocket } from '@core/hono-ws'
import { env } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

export const baseApp = new Hono().use('*', logger()).use(
  '*',
  cors({
    origin: [env.gamesApp.url, env.controlApp.url],
    credentials: true,
  }),
)

export const { upgradeWebSocket, injectWebSocket, closeWebSocketServer } =
  createNodeWebSocket({
    app: baseApp,
    baseUrl: env.gamesApi.url,
  })
