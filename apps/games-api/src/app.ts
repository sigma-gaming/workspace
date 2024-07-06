import { baseApp } from './app-base'
import { authRouter } from './routes/auth'
import { balanceRouter } from './routes/balance'
import { chatRouter } from './routes/chat'
import { gamesRouter } from './routes/games'
import { meRouter } from './routes/me'
import { notificationsRouter } from './routes/notifications'
import { settingsRouter } from './routes/settings'

export const app = baseApp
  .route('/notifications', notificationsRouter)
  .route('/chat', chatRouter)
  .route('/auth', authRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  .route('/balance', balanceRouter)
  .route('/games', gamesRouter)
