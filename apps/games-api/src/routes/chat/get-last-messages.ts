import { ChatMessageSelect } from '@games/db-schema'
import { chatService } from '@games/services'
import { procedure } from '../trpc'

export const getLastMessages = procedure.query(
  async (): Promise<ChatMessageSelect[]> => {
    return chatService.getLastMessages()
  },
)
