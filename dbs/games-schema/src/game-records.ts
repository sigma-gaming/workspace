import { GameSnapshot } from '@dbs/games-types'
import {
  bigint,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { gameEnum, gameOutcomeEnum } from './enums'
import { TransactionTable } from './transactions'
import { UserTable } from './users'

export const GameRecordTable = pgTable('GameRecord', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  game: gameEnum('game').notNull(),
  outcome: gameOutcomeEnum('outcome').notNull(),
  snapshot: json('snapshot').$type<GameSnapshot>().notNull(),

  bet: bigint('bet', { mode: 'number' }).notNull(),
  multiplier: integer('multiplier').notNull(),
  payout: bigint('payout', { mode: 'number' }).notNull(),

  previewUserName: text('previewUserName').notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: integer('transactionId')
    .references(() => TransactionTable.id, { onDelete: 'cascade' })
    .notNull(),
})

export type GameRecordSelect = typeof GameRecordTable.$inferSelect
export type GameRecordInsert = typeof GameRecordTable.$inferInsert
