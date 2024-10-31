import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const UserSecurityTable = pgTable(
  'UserSecurity',
  {
    userId: uuid('userId')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .primaryKey(),

    whitelisted: boolean('whitelisted').notNull().default(false),

    lastIP: text('lastIP'),
    addressTon: text('addressTon'),
    addressUsdt: text('addressUsdt'),
    addressUsdc: text('addressUsdc'),
    addressTrx: text('addressTrx'),
    addressEth: text('addressEth'),
    addressBtc: text('addressBtc'),
    addressLtc: text('addressLtc'),
    addressDoge: text('addressDoge'),
    addressBnb: text('addressBnb'),
    addressXmr: text('addressXmr'),
    addressSol: text('addressSol'),
    ipScore: integer('ipScore').notNull().default(0),
    addressTonScore: integer('addressTonScore').notNull().default(0),
    addressUsdtScore: integer('addressUsdtScore').notNull().default(0),
    addressUsdcScore: integer('addressUsdcScore').notNull().default(0),
    addressTrxScore: integer('addressTrxScore').notNull().default(0),
    addressEthScore: integer('addressEthScore').notNull().default(0),
    addressBtcScore: integer('addressBtcScore').notNull().default(0),
    addressLtcScore: integer('addressLtcScore').notNull().default(0),
    addressDogeScore: integer('addressDogeScore').notNull().default(0),
    addressBnbScore: integer('addressBnbScore').notNull().default(0),
    addressXmrScore: integer('addressXmrScore').notNull().default(0),
    addressSolScore: integer('addressSolScore').notNull().default(0),
  },
  (table) => ({
    lastIpIdx: index().on(table.lastIP),
  }),
)

export type UserSecuritySelect = typeof UserSecurityTable.$inferSelect
