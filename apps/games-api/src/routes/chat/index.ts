import { createRouter } from '../trpc'
import { getActual } from './get-actual'
import { sendMessage } from './send-message'
import { subscription } from './subscription'

export const chatRouter = createRouter({
  getActual,
  sendMessage,
  subscription,
})
