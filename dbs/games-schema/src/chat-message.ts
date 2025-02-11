import {
  ChatMessageAttachment,
  ChatMessageType,
  UserRole,
} from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from './lib/sql'
import { ProfileTable } from './user/profile'
import { UserTable } from './user/user'

export const ChatMessageTable = pgTable(
  'chat_message',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    trackingId: uuid('tracking_id').notNull().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    type: smallint('type').$type<ChatMessageType>().notNull(),
    text: text('text'),
    attachments: jsonb('attachments')
      .$type<ChatMessageAttachment[]>()
      .default([]),

    senderName: text('sender_name'),
    senderUsername: text('sender_username'),
    senderImage: text('sender_image'),
    senderRoles: smallint('sender_roles').$type<UserRole>().array(),

    isPinned: boolean('is_pinned').default(false).notNull(),

    userId: uuid('user_id').references(() => UserTable.id, {
      onDelete: 'cascade',
    }),
    profileId: integer('profile_id').references(() => ProfileTable.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => ({
    pinned: index('IX_chat_message_is_pinned')
      .on(table.isPinned)
      .where(sql`${table.isPinned} = true`),
  }),
)

export type ChatMessageSelect = typeof ChatMessageTable.$inferSelect
export type ChatMessageInsert = typeof ChatMessageTable.$inferInsert
