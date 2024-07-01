import { baseApp } from './app-base'
import { authRouter } from './router/auth'
import { balanceRouter } from './router/balance'
import { chatRouter } from './router/chat'
import { gamesRouter } from './router/games'
import { meRouter } from './router/me'
import { notificationsRouter } from './router/notifications'
import { settingsRouter } from './router/settings'

export const app = baseApp
  .route('/notifications', notificationsRouter)
  .route('/chat', chatRouter)
  .route('/auth', authRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  .route('/balance', balanceRouter)
  .route('/games', gamesRouter)
