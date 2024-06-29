import { Hono } from 'hono'
import { getLastMessagesRoute } from './get-last-messages'
import { sendMessageRoute } from './send-message'

export const chatRouter = new Hono()
  .route('/getLastMessages', getLastMessagesRoute)
  .route('/sendMessage', sendMessageRoute)
