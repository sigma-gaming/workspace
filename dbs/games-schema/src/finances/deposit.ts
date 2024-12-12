import { DepositPayload } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  bigint,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  currencyEnum,
  depositMethodEnum,
  depositTypeEnum,
  paymentProviderEnum,
  paymentStatusEnum,
} from '../enums'
import { UserTable } from '../user/user'
import { TransactionTable } from './transaction'

export const DepositTable = pgTable('Deposit', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),

  status: paymentStatusEnum('status').notNull(),
  userAmount: bigint('userAmount', { mode: 'number' }).notNull(),
  providerAmount: numeric('providerAmount', {
    precision: 20,
    scale: 18,
  }).notNull(),
  type: depositTypeEnum('type').notNull(),
  method: depositMethodEnum('method').notNull(),
  currency: currencyEnum('currency').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerTransactionId: text('providerTransactionId').notNull(),
  payload: jsonb('payload').$type<DepositPayload>().notNull(),

  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: bigint('transactionId', { mode: 'number' }).references(
    () => TransactionTable.id,
    { onDelete: 'cascade' },
  ),
})

export type DepositSelect = typeof DepositTable.$inferSelect
export type DepositInsert = typeof DepositTable.$inferInsert
