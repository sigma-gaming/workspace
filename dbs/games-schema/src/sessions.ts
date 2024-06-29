import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accountProviderEnum } from './enums'
import { UserTable } from './users'

export const SessionTable = pgTable('Session', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  provider: accountProviderEnum('provider').notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
})

export type SessionSelect = typeof SessionTable.$inferSelect
