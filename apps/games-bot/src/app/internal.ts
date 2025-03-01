import { Hono } from 'hono'
import { healthyRoute, readyRoute } from '../routes/health'

export const internalApp = new Hono()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
