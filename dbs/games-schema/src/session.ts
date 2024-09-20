import {
  bigserial,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { accountProviderEnum } from './enums'
import { UserTable } from './user'

export const SessionTable = pgTable('Session', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  preventAutoDelete: boolean('preventAutoDelete').default(false).notNull(),
  provider: accountProviderEnum('provider').notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
})

export type SessionSelect = typeof SessionTable.$inferSelect
