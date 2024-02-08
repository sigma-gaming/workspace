import { createRouter } from '../trpc'
import { getActual } from './get-actual'
import { subscription } from './subscription'

export const notificationsRouter = createRouter({
  getActual,
  subscription,
})
