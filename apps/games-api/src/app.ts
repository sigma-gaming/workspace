import { env } from '@games/services'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthyRoute, readyRoute } from './health'
import { createRouter } from './hono'
import { sessionMiddleware } from './middlewares/session'
import { authRouter } from './routes/auth'
import { balanceRouter } from './routes/balance'
import { chatRouter } from './routes/chat'
import { gameHistoryRouter } from './routes/game-history'
import { meRouter } from './routes/me'
import { notificationsRouter } from './routes/notifications'
import { promocodesRouter } from './routes/promocodes'
import { settingsRouter } from './routes/settings'
import { tasksRouter } from './routes/tasks'
import { sentryMiddleware } from './shared/sentry'

export const app = createRouter()
  .use(
    '*',
    cors({
      origin: [env.gamesApp.url, env.controlApp.url],
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .use('*', sessionMiddleware)
  .use('*', sentryMiddleware({ enabled: env.isProd }))
  .use('*', logger())
  .route('/notifications', notificationsRouter)
  .route('/chat', chatRouter)
  .route('/auth', authRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  .route('/balance', balanceRouter)
  .route('/gameHistory', gameHistoryRouter)
  .route('/promocodes', promocodesRouter)
  .route('/tasks', tasksRouter)
