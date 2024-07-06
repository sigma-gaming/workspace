import { Hono } from 'hono'
import { logoutRoute } from './logout'
import { providersRouter } from './providers'

export const authRouter = new Hono()
  .route('/providers', providersRouter)
  .route('/logout', logoutRoute)
