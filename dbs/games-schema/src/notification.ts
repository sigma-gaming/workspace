import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { notificationKindEnum } from './enums'
import { uuidv7 } from './lib/sql'
import { UserTable } from './user/user'

export const NotificationTable = pgTable('Notification', {
  id: uuid('id').primaryKey().default(uuidv7),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  kind: notificationKindEnum('kind').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  autoClose: boolean('autoClose').notNull(),
  autoCloseMs: integer('autoCloseMs').notNull(),
  withCloseButton: boolean('withCloseButton').notNull(),
  userId: uuid('userId').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),
})

export type NotificationSelect = typeof NotificationTable.$inferSelect
export type NotificationInsert = typeof NotificationTable.$inferInsert
