import { ChatMessage, ChatMessageAttachmentType, User } from '@games/db-schema'
import { z } from 'zod'
import { ProfileDetailed } from './profile'

export interface ChatMessageUser {
  id: User['id']
  roles: User['roles']
  profile: Pick<ProfileDetailed, 'id' | 'name' | 'username' | 'image'>
}

export interface ChatMessageDetailed {
  chatMessage: ChatMessage
  user?: ChatMessageUser
}

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
  }),
}
