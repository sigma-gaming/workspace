import { createRouter } from '../trpc'
import { getActualMessages } from './get-actual-messages'
import { sendMessage } from './send-message'
import { subscription } from './subscription'

export const chatRouter = createRouter({
  getActualMessages,
  sendMessage,
  subscription,
})
