import { sql } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { userRoleEnum } from '../enums'
import { uuidv7 } from '../lib/sql'

export const UserTable = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
    roles: userRoleEnum('roles')
      .array()
      .notNull()
      .default(sql`'{"User"}'`),

    virtual: boolean('virtual').notNull().default(false),

    referrerId: uuid('referrerId'),
    referralCampaignId: uuid('referralCampaignId'),
    profileId: integer('profileId'),
    securityId: uuid('securityId'),
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
