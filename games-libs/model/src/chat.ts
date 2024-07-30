import { ChatMessageAttachmentType } from '@dbs/games-types'
import { z } from 'zod'

export const ChatValidation = {
  MessagePayloadSchema: z.object({
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
    trackingId: z.string().uuid(),
  }),
}
