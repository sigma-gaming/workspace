import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env'
import { createRouter } from './hono'
import { sentryMiddleware } from './middlewares/sentry'
import { accessRoute } from './routes/access'
import { affiliateRouter } from './routes/affiliate'
import { balanceRouter } from './routes/balance'
import { chatRouter } from './routes/chat'
import { gameHistoryRouter } from './routes/game-history'
import { healthyRoute, readyRoute } from './routes/health'
import { meRouter } from './routes/me'
import { notificationsRouter } from './routes/notifications'
import { promocodesRouter } from './routes/promocodes'
import { settingsRouter } from './routes/settings'
import { tasksRouter } from './routes/tasks'

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
  .use('*', sentryMiddleware({ enabled: env.isProd }))
  .use('*', logger())
  .route('/access', accessRoute)
  .route('/notifications', notificationsRouter)
  .route('/chat', chatRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  .route('/balance', balanceRouter)
  .route('/gameHistory', gameHistoryRouter)
  .route('/promocodes', promocodesRouter)
  .route('/tasks', tasksRouter)
  .route('/affiliate', affiliateRouter)
