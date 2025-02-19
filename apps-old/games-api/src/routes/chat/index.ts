import { createRouter } from '../../app/router'
import { getLastMessagesRoute } from './get-last-messages'
import { sendMessageRoute } from './send-message'

export const chatRouter = createRouter()
  .route('/getLastMessages', getLastMessagesRoute)
  .route('/sendMessage', sendMessageRoute)
