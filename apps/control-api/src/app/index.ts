import { fraudServiceRouter } from '../routes/fraud'
import { maintenanceRouter } from '../routes/maintenance'
import { meRouter } from '../routes/me'
import { notificationsRouter } from '../routes/notifications'
import { promocodesRouter } from '../routes/promocodes'
import { usersRouter } from '../routes/users'
import { baseApp } from './base'

export const app = baseApp
  .route('/me', meRouter)
  .route('/notifications', notificationsRouter)
  .route('/maintenance', maintenanceRouter)
  .route('/fraud', fraudServiceRouter)
  .route('/users', usersRouter)
  .route('/promocodes', promocodesRouter)

export type ApiType = typeof app
