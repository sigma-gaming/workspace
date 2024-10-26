import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { healthyRoute, readyRoute } from './health'
import { ControlApiEnv } from './hono'
import { sessionMiddleware } from './middlewares/session'
import { fraudServiceRouter } from './routes/fraud'
import { maintenanceRouter } from './routes/maintenance'
import { notificationsRouter } from './routes/notifications'
import { promocodesRouter } from './routes/promocodes'
import { usersRouter } from './routes/users'

export const app = new Hono<ControlApiEnv>()
  .use(
    '*',
    cors({
      origin: env.controlApp.url,
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
  .use('*', sessionMiddleware)
  .route('/notifications', notificationsRouter)
  .route('/maintenance', maintenanceRouter)
  .route('/fraud', fraudServiceRouter)
  .route('/users', usersRouter)
  .route('/promocodes', promocodesRouter)
