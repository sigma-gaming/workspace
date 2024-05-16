import { ChatMessageSelect } from '@dbs/games-schema'
import { ChatValidation } from '@games/model'
import { chatService, sessionService } from '@games/services'
import { procedure } from '../trpc'

export const sendMessage = procedure
  .input(ChatValidation.MessagePayloadSchema)
  .mutation(async ({ ctx, input }): Promise<ChatMessageSelect> => {
    const user = sessionService.getUser(ctx.session)

    const chatMessage = await chatService.sendMessage({
      userId: user.id,
      payload: input,
    })

    return chatMessage
  })
