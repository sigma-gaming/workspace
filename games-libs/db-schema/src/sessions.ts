import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { Users } from './users'

export const Sessions = pgTable('Sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  userId: uuid('userId')
    .references(() => Users.id, { onDelete: 'cascade' })
    .notNull(),
})

export type Session = typeof Sessions.$inferSelect
