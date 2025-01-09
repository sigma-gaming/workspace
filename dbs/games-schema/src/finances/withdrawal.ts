import { sql } from 'drizzle-orm'
import {
  bigint,
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
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'
import { TransactionTable } from './transaction'

export const WithdrawalTable = pgTable('Withdrawal', {
  id: uuid('id').primaryKey().default(uuidv7),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),

  gemAmount: bigint('gemAmount', { mode: 'number' }).notNull(),
  currencyAmount: numeric('currencyAmount', {
    precision: 20,
    scale: 18,
  }).notNull(),
  providerAmount: text('providerAmount').notNull(),
  status: paymentStatusEnum('status').notNull(),
  currency: currencyEnum('currency').notNull(),
  method: withdrawalMethodEnum('method').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerTransactionId: text('providerTransactionId').notNull(),

  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: uuid('transactionId').references(() => TransactionTable.id, {
    onDelete: 'cascade',
  }),
})

export type WithdrawalSelect = typeof WithdrawalTable.$inferSelect
export type WithdrawalInsert = typeof WithdrawalTable.$inferInsert
