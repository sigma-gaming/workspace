import { Hono } from 'hono'
import { maintenanceRouter } from './routes/maintenance'
import { notificationsRouter } from './routes/notifications'

export const app = new Hono()
  .route('/notifications', notificationsRouter)
  .route('/maintenance', maintenanceRouter)
