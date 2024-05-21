import { createRouter } from '../trpc'
import { subscription } from './subscription'

export const eventsRouter = createRouter({
  subscription,
})
