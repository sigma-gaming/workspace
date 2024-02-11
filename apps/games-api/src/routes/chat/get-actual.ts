import { ChatMessageDetailed } from '@games/model'
import { chatService } from '@games/services'
import { procedure } from '../trpc'

export const getActual = procedure.query(
  async (): Promise<ChatMessageDetailed[]> => {
    return chatService.getLastMessages()
  },
)
