import { PromocodeBonus, PromocodeBonusType } from '@dbs/games-types'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const PromocodeTable = pgTable(
  'promocode',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'string',
    }),

    campaign: text('campaign'),
    code: text('code').unique().notNull(),
    wageringMultiplier: integer('wagering_multiplier').notNull(),
    usages: integer('usages').notNull(),
    maxUsages: integer('max_usages').notNull(),
    isActive: boolean('is_active').notNull(),
    bonusType: smallint('bonus_type').$type<PromocodeBonusType>().notNull(),
    bonus: jsonb('bonus').$type<PromocodeBonus>().notNull(),

    userId: uuid('user_id').references(() => UserTable.id, {
      onDelete: 'cascade',
    }),

    createdBy: uuid('created_by').references(() => UserTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    expiresAtIdx: index('IX_promocode_expires_at').on(table.expiresAt),
  }),
)

export type PromocodeSelect = typeof PromocodeTable.$inferSelect
