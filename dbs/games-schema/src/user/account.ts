import { AccountProvider } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from './user'

export const AccountTable = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    provider: smallint('provider').$type<AccountProvider>().notNull(),
    providerUserId: text('provider_user_id').notNull(),
    providerUsername: text('provider_username'),
    providerUserFirstName: text('provider_user_first_name').notNull(),
    providerUserLastName: text('provider_user_last_name'),
    providerUserImage: text('provider_user_image'),
    userId: uuid('user_id')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('IX_account_user_id').on(table.userId),
    providerUserIdIdx: index('IX_account_provider_user_id').on(
      table.providerUserId,
    ),
  }),
)

export type AccountSelect = typeof AccountTable.$inferSelect
export type AccountInsert = typeof AccountTable.$inferInsert
