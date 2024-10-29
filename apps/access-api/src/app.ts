import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { healthyRoute, readyRoute } from './health'
import { createRouter } from './hono'
import { exchangeRoute } from './routes/exchange'
import { logoutRoute } from './routes/logout'
import { refreshRoute } from './routes/refresh'

export const app = createRouter()
  .use(
    '*',
    cors({
      origin: [env.gamesApp.url, env.controlApp.url],
      credentials: true,
      allowHeaders: [
        'content-type',
        'sentry-trace',
        'baggage',
        'authorization',
      ],
    }),
  )
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use('*', logger())
  .route('/exchange', exchangeRoute)
  .route('/refresh', refreshRoute)
  .route('/logout', logoutRoute)
