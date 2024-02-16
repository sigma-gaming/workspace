import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accountProviderEnum } from './enums'
import { Users } from './users'

export const Accounts = pgTable('Accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  provider: accountProviderEnum('provider').notNull(),
  providerUserId: text('providerUserId').notNull(),
  providerUsername: text('providerUsername'),
  providerUserFirstName: text('providerUserFirstName').notNull(),
  providerUserLastName: text('providerUserLastName'),
  providerUserImage: text('providerUserImage'),
  userId: uuid('userId')
    .references(() => Users.id, { onDelete: 'cascade' })
    .notNull(),
})

export type Account = typeof Accounts.$inferSelect
export type AccountInsert = typeof Accounts.$inferInsert
