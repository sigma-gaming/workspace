import { bigint, integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { GameRecordTable } from '../games/game-record'
import { UserTable } from '../user/user'

export const BalanceTable = pgTable('Balance', {
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  available: bigint('available', { mode: 'number' }).notNull().default(0),

  wageringRequired: bigint('wageringRequired', { mode: 'number' })
    .notNull()
    .default(0),

  totalBet: bigint('totalBet', { mode: 'number' }).notNull().default(0),
  totalWon: bigint('totalWin', { mode: 'number' }).notNull().default(0),
  totalLost: bigint('totalLost', { mode: 'number' }).notNull().default(0),
  totalBetCount: integer('totalBetCount').notNull().default(0),

  maxWin: bigint('maxWin', { mode: 'number' }).notNull().default(0),
  maxWinGameId: uuid('maxWinGameId').references(() => GameRecordTable.id, {
    onDelete: 'cascade',
  }),

  maxMultiplier: integer('maxMultiplier').notNull().default(0),
  maxMultiplierGameId: uuid('maxMultiplierGameId').references(
    () => GameRecordTable.id,
    { onDelete: 'cascade' },
  ),
})

export type BalanceSelect = typeof BalanceTable.$inferSelect
export type BalanceInsert = typeof BalanceTable.$inferInsert
