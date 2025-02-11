import { Game, GameOutcome, GameSnapshot } from '@dbs/games-types'
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { TransactionTable } from '../finances/transaction'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const GameRecordTable = pgTable(
  'game_record',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    game: smallint('game').$type<Game>().notNull(),
    outcome: smallint('outcome').$type<GameOutcome>().notNull(),
    snapshot: jsonb('snapshot').$type<GameSnapshot>().notNull(),

    bet: bigint('bet', { mode: 'number' }).notNull(),
    multiplier: integer('multiplier').notNull(),
    payout: bigint('payout', { mode: 'number' }).notNull(),

    previewUserName: text('preview_user_name').notNull(),
    userId: uuid('user_id')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
    transactionId: uuid('transaction_id')
      .references(() => TransactionTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('IX_game_record_user_id').on(table.userId),
  }),
)

export type GameRecordSelect = typeof GameRecordTable.$inferSelect
export type GameRecordInsert = typeof GameRecordTable.$inferInsert
