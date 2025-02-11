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
  'user_security',
  {
    userId: uuid('user_id')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .primaryKey(),

    whitelisted: boolean('whitelisted').notNull().default(false),

    lastIP: text('last_ip'),
    addressTon: text('address_ton'),
    addressUsdt: text('address_usdt'),
    addressUsdc: text('address_usdc'),
    addressTrx: text('address_trx'),
    addressEth: text('address_eth'),
    addressBtc: text('address_btc'),
    addressLtc: text('address_ltc'),
    addressDoge: text('address_doge'),
    addressBnb: text('address_bnb'),
    addressXmr: text('address_xmr'),
    addressSol: text('address_sol'),
    ipScore: integer('ip_score').notNull().default(0),
    addressTonScore: integer('address_ton_score').notNull().default(0),
    addressUsdtScore: integer('address_usdt_score').notNull().default(0),
    addressUsdcScore: integer('address_usdc_score').notNull().default(0),
    addressTrxScore: integer('address_trx_score').notNull().default(0),
    addressEthScore: integer('address_eth_score').notNull().default(0),
    addressBtcScore: integer('address_btc_score').notNull().default(0),
    addressLtcScore: integer('address_ltc_score').notNull().default(0),
    addressDogeScore: integer('address_doge_score').notNull().default(0),
    addressBnbScore: integer('address_bnb_score').notNull().default(0),
    addressXmrScore: integer('address_xmr_score').notNull().default(0),
    addressSolScore: integer('address_sol_score').notNull().default(0),
  },
  (table) => ({
    lastIpIdx: index('IX_user_security_last_ip').on(table.lastIP),
  }),
)

export type UserSecuritySelect = typeof UserSecurityTable.$inferSelect
