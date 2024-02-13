import { ChatMessageDetailed, ChatValidation } from '@games/model'
import { chatService, sessionService } from '@games/services'
import { procedure } from '../trpc'

export const sendMessage = procedure
  .input(ChatValidation.MessagePayloadSchema)
  .mutation(async ({ ctx, input }): Promise<ChatMessageDetailed> => {
    const user = sessionService.getUser(ctx.session)

    const detailedChatMessage = await chatService.sendMessage({
      userId: user.id,
      payload: input,
    })

    return detailedChatMessage
  })
