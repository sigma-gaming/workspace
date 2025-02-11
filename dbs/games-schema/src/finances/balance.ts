import { bigint, integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { GameRecordTable } from '../games/game-record'
import { UserTable } from '../user/user'

export const BalanceTable = pgTable('balance', {
  userId: uuid('user_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  available: bigint('available', { mode: 'number' }).notNull().default(0),

  wageringRequired: bigint('wagering_required', { mode: 'number' })
    .notNull()
    .default(0),

  totalBet: bigint('total_bet', { mode: 'number' }).notNull().default(0),
  totalWon: bigint('total_won', { mode: 'number' }).notNull().default(0),
  totalLost: bigint('total_lost', { mode: 'number' }).notNull().default(0),
  totalBetCount: integer('total_bet_count').notNull().default(0),

  maxWin: bigint('max_win', { mode: 'number' }).notNull().default(0),
  maxWinGameId: uuid('max_win_game_id').references(() => GameRecordTable.id),

  maxMultiplier: integer('max_multiplier').notNull().default(0),
  maxMultiplierGameId: uuid('max_multiplier_game_id').references(
    () => GameRecordTable.id,
  ),
})

export type BalanceSelect = typeof BalanceTable.$inferSelect
export type BalanceInsert = typeof BalanceTable.$inferInsert
