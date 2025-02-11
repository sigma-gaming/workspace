import { NotificationKind } from '@dbs/games-types'
import {
  boolean,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from './lib/sql'
import { UserTable } from './user/user'

export const NotificationTable = pgTable('notification', {
  id: uuid('id').primaryKey().default(uuidv7),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  kind: smallint('kind').$type<NotificationKind>().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  autoClose: boolean('auto_close').notNull(),
  autoCloseMs: integer('auto_close_ms').notNull(),
  withCloseButton: boolean('with_close_button').notNull(),
  userId: uuid('user_id').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),
})

export type NotificationSelect = typeof NotificationTable.$inferSelect
export type NotificationInsert = typeof NotificationTable.$inferInsert
