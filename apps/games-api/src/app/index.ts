import { affiliateRouter } from '../routes/affiliate'
import { chatRouter } from '../routes/chat'
import { gameHistoryRouter } from '../routes/game-history'
import { meRouter } from '../routes/me'
import { notificationsRouter } from '../routes/notifications'
import { paymentsRouter } from '../routes/payments'
import { promocodesRouter } from '../routes/promocodes'
import { settingsRouter } from '../routes/settings'
import { tasksRouter } from '../routes/tasks'
import { baseApp } from './base'

export const app = baseApp
  .route('/notifications', notificationsRouter)
  .route('/chat', chatRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  .route('/payments', paymentsRouter)
  .route('/gameHistory', gameHistoryRouter)
  .route('/promocodes', promocodesRouter)
  .route('/tasks', tasksRouter)
  .route('/affiliate', affiliateRouter)

export type ApiType = typeof app
