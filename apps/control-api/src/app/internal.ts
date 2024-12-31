import { HonoUwsEnv } from '@core/server'
import { Hono } from 'hono'
import { healthyRoute, readyRoute } from '../routes/health'

export const internalApp = new Hono<HonoUwsEnv>()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)
