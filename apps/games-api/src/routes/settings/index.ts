import { Hono } from 'hono'
import { updateProfileRoute } from './update-profile'

export const settingsRouter = new Hono().route(
  '/updateProfile',
  updateProfileRoute,
)
