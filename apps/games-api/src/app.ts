import { env } from '@games/services'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { sessionMiddleware } from './middlewares/session'
import { authRouter } from './routes/auth'
import { balanceRouter } from './routes/balance'
import { chatRouter } from './routes/chat'
import { gameHistoryRouter } from './routes/game-history'
import { meRouter } from './routes/me'
import { notificationsRouter } from './routes/notifications'
import { settingsRouter } from './routes/settings'
import { sentryMiddleware } from './shared/sentry'

export const app = new Hono()
  .use('*', sessionMiddleware)
  .use('*', sentryMiddleware({ enabled: env.isProd }))
  .use('*', logger())
  .use(
    '*',
    cors({
      origin: [env.gamesApp.url, env.controlApp.url],
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/notifications', notificationsRouter)
  .route('/chat', chatRouter)
  .route('/auth', authRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  .route('/balance', balanceRouter)
  .route('/gameHistory', gameHistoryRouter)
