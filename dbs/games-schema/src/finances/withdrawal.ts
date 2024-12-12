import { sql } from 'drizzle-orm'
import {
  bigint,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  currencyEnum,
  paymentProviderEnum,
  paymentStatusEnum,
  withdrawalMethodEnum,
} from '../enums'
import { UserTable } from '../user/user'
import { TransactionTable } from './transaction'

export const WithdrawalTable = pgTable('Withdrawal', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),

  userAmount: bigint('userAmount', { mode: 'number' }).notNull(),
  providerAmount: numeric('providerAmount', {
    precision: 20,
    scale: 18,
  }).notNull(),
  status: paymentStatusEnum('status').notNull(),
  currency: currencyEnum('currency').notNull(),
  method: withdrawalMethodEnum('method').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerTransactionId: text('providerTransactionId').notNull(),

  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: bigint('transactionId', { mode: 'number' }).references(
    () => TransactionTable.id,
    { onDelete: 'cascade' },
  ),
})

export type WithdrawalSelect = typeof WithdrawalTable.$inferSelect
export type WithdrawalInsert = typeof WithdrawalTable.$inferInsert
