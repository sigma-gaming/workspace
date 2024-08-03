import { bigint, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { gameEnum, transactionTypeEnum } from './enums'
import { UserTable } from './users'

export const TransactionTable = pgTable('Transaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  type: transactionTypeEnum('type').notNull(),
  game: gameEnum('game'),

  openingBalance: bigint('openingBalance', { mode: 'number' })
    .notNull()
    .default(0),
  closingBalance: bigint('closingBalance', { mode: 'number' }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),

  wageringRequired: bigint('wageringRequired', { mode: 'number' })
    .notNull()
    .default(0),

  totalBet: bigint('totalBet', { mode: 'number' }).notNull().default(0),
  totalWon: bigint('totalWin', { mode: 'number' }).notNull().default(0),
  totalLost: bigint('totalLost', { mode: 'number' }).notNull().default(0),
  totalRTP: bigint('totalRTP', { mode: 'number' }).notNull().default(0),

  userId: uuid('userId')
    .references(() => UserTable.id)
    .notNull(),
  gameRecordId: uuid('gameRecordId'),
})

export type TransactionSelect = typeof TransactionTable.$inferSelect
export type TransactionInsert = typeof TransactionTable.$inferInsert
