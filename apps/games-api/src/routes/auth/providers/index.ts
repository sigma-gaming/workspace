import { Hono } from 'hono'
import { signInViaTelegramRoute } from './telegram'
import { signInViaVkRoute } from './vk'

export const providersRouter = new Hono()
  .route('/signInViaTelegram', signInViaTelegramRoute)
  .route('/signInViaVk', signInViaVkRoute)
