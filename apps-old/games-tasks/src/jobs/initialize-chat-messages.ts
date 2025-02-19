import { chatService } from '@games/services'
import { createJob } from '../shared/jobs'

export const initializeChatMessagesJob = createJob({
  name: 'InitializeChatMessages',
  cronTime: '*/10 * * * *', // every 10 minutes
  handler: () => chatService.initializeMessages(),
})
