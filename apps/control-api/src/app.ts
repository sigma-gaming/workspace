import { baseApp } from './app-base'
import { maintenanceRouter } from './routes/maintenance'
import { notificationsRouter } from './routes/notifications'

export const app = baseApp
  .route('/notifications', notificationsRouter)
  .route('/maintenance', maintenanceRouter)
