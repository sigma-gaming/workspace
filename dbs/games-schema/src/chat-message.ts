import { ChatMessageAttachment } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { chatMessageTypeEnum, userRoleEnum } from './enums'
import { uuidv7 } from './lib/sql'
import { ProfileTable } from './user/profile'
import { UserTable } from './user/user'

export const ChatMessageTable = pgTable(
  'ChatMessage',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    trackingId: uuid('trackingId').notNull().default(uuidv7),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    type: chatMessageTypeEnum('type').notNull(),
    text: text('text'),
    attachments: jsonb('attachments')
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
    profileId: integer('profileId').references(() => ProfileTable.id, {
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
