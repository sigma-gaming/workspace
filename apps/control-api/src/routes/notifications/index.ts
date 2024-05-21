import { createRouter } from '../trpc'
import { send } from './send-notification'

export const notificationsRouter = createRouter({
  send,
})
