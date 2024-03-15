import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './users'

export const SessionTable = pgTable('Session', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
})

export type SessionSelect = typeof SessionTable.$inferSelect
