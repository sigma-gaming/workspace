import { UserRole } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  smallint,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'

export const UserTable = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    roles: smallint('roles')
      .array()
      .notNull()
      .$type<UserRole[]>()
      .default(sql`'{0}'`),

    virtual: boolean('virtual').notNull().default(false),

    referrerId: uuid('referrer_id'),
    referralCampaignId: uuid('referral_campaign_id'),
    profileId: integer('profile_id'),
  },
  (table) => ({
    referrerIdKey: foreignKey({
      columns: [table.referrerId],
      foreignColumns: [table.id],
    }).onDelete('set null'),
  }),
)

export type UserSelect = typeof UserTable.$inferSelect
export type UserInsert = typeof UserTable.$inferInsert
