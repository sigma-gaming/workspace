import {
  Currency,
  PaymentProvider,
  PaymentStatus,
  WithdrawalMethod,
} from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  bigint,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'
import { TransactionTable } from './transaction'

export const WithdrawalTable = pgTable('withdrawal', {
  id: uuid('id').primaryKey().default(uuidv7),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),

  gemAmount: bigint('gem_amount', { mode: 'number' }).notNull(),
  currencyAmount: numeric('currency_amount', {
    precision: 20,
    scale: 18,
  }).notNull(),
  providerAmount: text('provider_amount').notNull(),
  status: smallint('status').$type<PaymentStatus>().notNull(),
  currency: smallint('currency').$type<Currency>().notNull(),
  method: smallint('method').$type<WithdrawalMethod>().notNull(),
  provider: smallint('provider').$type<PaymentProvider>().notNull(),
  providerTransactionId: text('provider_transaction_id').notNull(),

  userId: uuid('user_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: uuid('transaction_id').references(() => TransactionTable.id, {
    onDelete: 'cascade',
  }),
})

export type WithdrawalSelect = typeof WithdrawalTable.$inferSelect
export type WithdrawalInsert = typeof WithdrawalTable.$inferInsert
