import {
  bigint,
  bigserial,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { gameEnum, transactionTypeEnum } from './enums'
import { UserTable } from './user'

export const TransactionTable = pgTable('Transaction', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  type: transactionTypeEnum('type').notNull(),
  game: gameEnum('game'),
  amount: bigint('amount', { mode: 'number' }).notNull(),

  userId: uuid('userId').references(() => UserTable.id, {
    onDelete: 'set null',
  }),
  gameRecordId: bigint('gameRecordId', { mode: 'number' }),
})

export type TransactionSelect = typeof TransactionTable.$inferSelect
export type TransactionInsert = typeof TransactionTable.$inferInsert
