import { chatService } from '@games/services'
import { createJob } from '../shared/jobs'

export const initializeChatMessagesJob = createJob({
  name: 'InitializeChatMessages',
  cronTime: '0 */1 * * *', // every 1 hour
  handler: () => chatService.initializeMessages(),
})
