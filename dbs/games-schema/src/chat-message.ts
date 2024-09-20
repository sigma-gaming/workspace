import { ChatMessageAttachment } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  bigserial,
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { chatMessageTypeEnum, userRoleEnum } from './enums'
import { UserTable } from './user'

export const ChatMessageTable = pgTable(
  'ChatMessage',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    trackingId: uuid('trackingId').notNull().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    type: chatMessageTypeEnum('type').notNull(),
    text: text('text'),
    attachments: json('attachments')
      .$type<ChatMessageAttachment[]>()
      .default([]),

    senderName: text('senderName'),
    senderUsername: text('senderUsername'),
    senderImage: text('senderImage'),
    senderRoles: userRoleEnum('senderRoles').array(),

    isPinned: boolean('isPinned').default(false).notNull(),

    userId: uuid('userId').references(() => UserTable.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => ({
    pinned: index()
      .on(table.isPinned)
      .where(sql`${table.isPinned} = true`),
  }),
)

export type ChatMessageSelect = typeof ChatMessageTable.$inferSelect
export type ChatMessageInsert = typeof ChatMessageTable.$inferInsert
