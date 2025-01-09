import { GameSnapshot } from '@dbs/games-types'
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { gameEnum, gameOutcomeEnum } from '../enums'
import { TransactionTable } from '../finances/transaction'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const GameRecordTable = pgTable(
  'GameRecord',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    game: gameEnum('game').notNull(),
    outcome: gameOutcomeEnum('outcome').notNull(),
    snapshot: jsonb('snapshot').$type<GameSnapshot>().notNull(),

    bet: bigint('bet', { mode: 'number' }).notNull(),
    multiplier: integer('multiplier').notNull(),
    payout: bigint('payout', { mode: 'number' }).notNull(),

    previewUserName: text('previewUserName').notNull(),
    userId: uuid('userId')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
    transactionId: uuid('transactionId')
      .references(() => TransactionTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
  }),
)

export type GameRecordSelect = typeof GameRecordTable.$inferSelect
export type GameRecordInsert = typeof GameRecordTable.$inferInsert
