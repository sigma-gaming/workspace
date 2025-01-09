import { ChatMessageSelect } from '@dbs/games-schema'
import { ChatMessageAttachmentType, UserRole } from '@dbs/games-types'
import { z } from 'zod'

export type ChatMessageDetailed = ChatMessageSelect & {
  senderName: string | null
  senderUsername: string | null
  senderImage: string | null
  senderRoles: UserRole[] | null
}

export const ChatValidation = {
  MessagePayloadSchema: z.strictObject({
    text: z
      .string()
      .min(1, 'Слишком короткое сообщение')
      .max(512, 'Слишком длинное сообщение'),
    attachments: z
      .array(
        z.object({
          type: z.nativeEnum(ChatMessageAttachmentType),
          gameRecordId: z.string().uuid(),
        }),
      )
      .max(1, 'Доступно только одно вложение'),
    trackingId: z.string().uuid(),
  }),
}
