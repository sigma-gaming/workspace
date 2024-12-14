import { Hono } from 'hono'
import { getStateRoute } from './get-state'
import { updateStateRoute } from './update-state'

export const maintenanceRouter = new Hono()
  .route('/getState', getStateRoute)
  .route('/updateState', updateStateRoute)
