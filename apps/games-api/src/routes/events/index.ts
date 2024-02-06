import { createRouter } from '../trpc'
import { common } from './common'
import { notifications } from './notifications'

export const eventsRouter = createRouter({
  common,
  notifications,
})
