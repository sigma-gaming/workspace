import { createRouter } from '../trpc'
import { common } from './common'

export const eventsRouter = createRouter({
  common,
})
