import { Hono } from 'hono'
import { getActualRoute } from './get-actual'

export const notificationsRouter = new Hono().route(
  '/getActual',
  getActualRoute,
)
