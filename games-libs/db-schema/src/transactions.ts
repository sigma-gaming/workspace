import { bigint, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { gameEnum, transactionTypeEnum } from './enums'
import { Users } from './users'

export const Transactions = pgTable('Transactions', {
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

  totalBet: bigint('totalBet', { mode: 'number' }).notNull().default(0),
  totalWon: bigint('totalWin', { mode: 'number' }).notNull().default(0),
  totalLost: bigint('totalLost', { mode: 'number' }).notNull().default(0),
  totalRTP: bigint('totalRTP', { mode: 'number' }).notNull().default(0),

  userId: uuid('userId')
    .references(() => Users.id)
    .notNull(),
})

export type Transaction = typeof Transactions.$inferSelect
export type TransactionInsert = typeof Transactions.$inferInsert
