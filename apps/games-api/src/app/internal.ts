import { Hono } from 'hono'
import { healthyRoute, readyRoute } from '../routes/health'
import { metricsRoute } from '../routes/metrics'

export const internalApp = new Hono()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
  .route('/metrics', metricsRoute)
