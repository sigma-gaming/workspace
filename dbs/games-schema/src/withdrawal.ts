import { WithdrawalProviderPayload } from '@dbs/games-types'
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
  paymentProviderEnum,
  paymentStatusEnum,
  withdrawalMethodEnum,
} from './enums'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

export const Withdrawal = pgTable('Withdrawal', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),

  userAmount: bigint('userAmount', { mode: 'number' }).notNull(),
  providerAmount: bigint('providerAmount', { mode: 'number' }).notNull(),
  status: paymentStatusEnum('status').notNull(),
  currency: currencyEnum('currency').notNull(),
  method: withdrawalMethodEnum('method').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerPayload: jsonb('providerPayload')
    .$type<WithdrawalProviderPayload>()
    .notNull(),

  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  transactionId: bigint('transactionId', { mode: 'number' }).references(
    () => TransactionTable.id,
    { onDelete: 'cascade' },
  ),
})

export type WithdrawalSelect = typeof Withdrawal.$inferSelect
export type WithdrawalInsert = typeof Withdrawal.$inferInsert
