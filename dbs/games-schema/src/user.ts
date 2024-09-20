import { sql } from 'drizzle-orm'
import {
  AnyPgColumn,
  foreignKey,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { userRoleEnum } from './enums'
import { ReferralCampaignTable } from './referral-campaign'

export const UserTable = pgTable(
  'User',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    roles: userRoleEnum('roles')
      .array()
      .notNull()
      .default(sql`'{"User"}'`),

    referrerId: uuid('referrerId'),
    referralCampaignId: integer('referralCampaignId').references(
      (): AnyPgColumn => ReferralCampaignTable.id,
      { onDelete: 'set null' },
    ),
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
