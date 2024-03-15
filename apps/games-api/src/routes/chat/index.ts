import { createRouter } from '../trpc'
import { getLastMessages } from './get-last-messages'
import { sendMessage } from './send-message'
import { subscription } from './subscription'

export const chatRouter = createRouter({
  getLastMessages,
  sendMessage,
  subscription,
})
