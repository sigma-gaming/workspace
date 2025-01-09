import { sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accountProviderEnum } from '../enums'
import { uuidv7 } from '../lib/sql'
import { UserTable } from './user'

export const AccountTable = pgTable(
  'Account',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    provider: accountProviderEnum('provider').notNull(),
    providerUserId: text('providerUserId').notNull(),
    providerUsername: text('providerUsername'),
    providerUserFirstName: text('providerUserFirstName').notNull(),
    providerUserLastName: text('providerUserLastName'),
    providerUserImage: text('providerUserImage'),
    userId: uuid('userId')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
    providerUserIdIdx: index().on(table.providerUserId),
  }),
)

export type AccountSelect = typeof AccountTable.$inferSelect
export type AccountInsert = typeof AccountTable.$inferInsert
