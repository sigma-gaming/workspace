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
import { gameEnum, gameOutcomeEnum } from './enums'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

export const GameRecordTable = pgTable(
  'GameRecord',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    transactionId: bigint('transactionId', { mode: 'number' })
      .references(() => TransactionTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
  }),
)

export type GameRecordSelect = typeof GameRecordTable.$inferSelect
export type GameRecordInsert = typeof GameRecordTable.$inferInsert
