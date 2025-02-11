import { Game, TransactionType } from '@dbs/games-types'
import {
  bigint,
  index,
  pgTable,
  smallint,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const TransactionTable = pgTable(
  'transaction',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    type: smallint('type').$type<TransactionType>().notNull(),
    game: smallint('game').$type<Game>(),
    amount: bigint('amount', { mode: 'number' }).notNull(),

    userId: uuid('user_id').references(() => UserTable.id, {
      onDelete: 'set null',
    }),
    gameRecordId: uuid('game_record_id'),
  },
  (table) => ({
    userIdIdx: index('IX_transaction_user_id').on(table.userId),
    createdAtIdx: index('IX_transaction_created_at').on(table.createdAt),
  }),
)

export type TransactionSelect = typeof TransactionTable.$inferSelect
export type TransactionInsert = typeof TransactionTable.$inferInsert
