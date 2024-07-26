import { ChatMessageAttachment } from '@dbs/games-types'
import { json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { chatMessageTypeEnum, userRoleEnum } from './enums'
import { UserTable } from './users'

export const ChatMessageTable = pgTable('ChatMessage', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingId: uuid('trackingId').notNull().defaultRandom(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  type: chatMessageTypeEnum('type').notNull(),
  text: text('text'),
  attachments: json('attachments').$type<ChatMessageAttachment[]>().default([]),

  senderName: text('senderName'),
  senderUsername: text('senderUsername'),
  senderImage: text('senderImage'),
  senderRoles: userRoleEnum('senderRoles').array(),

  userId: uuid('userId').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),
})

export type ChatMessageSelect = typeof ChatMessageTable.$inferSelect
export type ChatMessageInsert = typeof ChatMessageTable.$inferInsert
