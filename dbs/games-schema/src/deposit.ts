import { DepositProviderPayload } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  bigint,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  currencyEnum,
  depositMethodEnum,
  paymentProviderEnum,
  paymentStatusEnum,
} from './enums'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

export const Deposit = pgTable('Deposit', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),

  status: paymentStatusEnum('status').notNull(),
  userAmount: bigint('userAmount', { mode: 'number' }).notNull(),
  providerAmount: bigint('providerAmount', { mode: 'number' }).notNull(),
  method: depositMethodEnum('method').notNull(),
  currency: currencyEnum('currency').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerPayload: jsonb('providerPayload')
    .$type<DepositProviderPayload>()
    .notNull(),

  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: bigint('transactionId', { mode: 'number' }).references(
    () => TransactionTable.id,
    { onDelete: 'cascade' },
  ),
})

export type DepositSelect = typeof Deposit.$inferSelect
export type DepositInsert = typeof Deposit.$inferInsert
