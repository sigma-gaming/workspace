import { Hono } from 'hono'
import { getMaintenanceRoute } from './get-maintenance'
import { updateMaintenanceRoute } from './update-maintenance'

export const maintenanceRouter = new Hono()
  .route('/get', getMaintenanceRoute)
  .route('/update', updateMaintenanceRoute)
