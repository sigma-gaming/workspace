import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './users'

export const UserSecurityTable = pgTable('UserSecurity', {
  id: uuid('id').defaultRandom().primaryKey(),
  lastIP: text('lastIP').notNull(),
  addressUsdt: text('addressUsdt'),
  addressUsdc: text('addressUsdc'),
  addressTrx: text('addressTrx'),
  addressEth: text('addressEth'),
  addressBtc: text('addressBtc'),
  addressLtc: text('addressLtc'),
  addressTon: text('addressTon'),
  addressDoge: text('addressDoge'),
  addressBnb: text('addressBnb'),
  addressXmr: text('addressXmr'),
  addressSol: text('addressSol'),

  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
})

export type UserSecuritySelect = typeof UserSecurityTable.$inferSelect
