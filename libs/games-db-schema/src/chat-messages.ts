import { json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { chatMessageTypeEnum } from './enums'
import { ChatMessageAttachmentType } from './enums-raw'
import { Users } from './users'

export interface ChatMessageAttachmentGame {
  type: ChatMessageAttachmentType.Game
  transactionId: string
}

export type ChatMessageAttachment = ChatMessageAttachmentGame

export const ChatMessages = pgTable('ChatMessages', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  type: chatMessageTypeEnum('type').notNull(),
  text: text('text'),
  attachments: json('attachments').$type<ChatMessageAttachment[]>().default([]),

  userId: uuid('userId').references(() => Users.id),
})

export type ChatMessage = typeof ChatMessages.$inferSelect
export type ChatMessageInsert = typeof ChatMessages.$inferInsert
