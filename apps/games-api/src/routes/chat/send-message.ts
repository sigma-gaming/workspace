import { ChatMessageAttachmentType } from '@games/db-schema'
import { ChatMessageDetailed } from '@games/model'
import { chatService, sessionService } from '@games/services'
import { z } from 'zod'
import { procedure } from '../trpc'

export const sendMessage = procedure
  .input(
    z.object({
      text: z
        .string()
        .min(1, 'Слишком короткое сообщение')
        .max(512, 'Слишком длинное сообщение'),
      attachments: z
        .array(
          z.object({
            type: z.nativeEnum(ChatMessageAttachmentType),
            transactionId: z.string().uuid(),
          }),
        )
        .max(1, 'Доступно только одно вложение'),
    }),
  )
  .mutation(async ({ ctx, input }): Promise<ChatMessageDetailed> => {
    const user = sessionService.getUser(ctx.session)

    const detailedChatMessage = await chatService.sendMessage({
      userId: user.id,
      payload: input,
    })

    return detailedChatMessage
  })
