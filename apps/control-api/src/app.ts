import { HonoUwsEnv } from '@core/hono-uws'
import { env } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { fraudServiceRouter } from './routes/fraud'
import { maintenanceRouter } from './routes/maintenance'
import { notificationsRouter } from './routes/notifications'
import { usersRouter } from './routes/users'

export const app = new Hono<HonoUwsEnv>()
  .use('*', logger())
  .use(
    '*',
    cors({
      origin: env.controlApp.url,
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/notifications', notificationsRouter)
  .route('/maintenance', maintenanceRouter)
  .route('/fraud', fraudServiceRouter)
  .route('/users', usersRouter)
