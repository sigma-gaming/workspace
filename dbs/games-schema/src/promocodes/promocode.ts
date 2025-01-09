import { PromocodeBonus } from '@dbs/games-types'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { promocodeBonusTypeEnum } from '../enums'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const PromocodeTable = pgTable(
  'Promocode',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expiresAt', {
      withTimezone: true,
      mode: 'string',
    }),

    campaign: text('campaign'),
    code: text('code').unique().notNull(),
    wageringMultiplier: integer('wageringMultiplier').notNull(),
    usages: integer('usages').notNull(),
    maxUsages: integer('maxUsages').notNull(),
    isActive: boolean('isActive').notNull(),
    bonusType: promocodeBonusTypeEnum('bonusType').notNull(),
    bonus: jsonb('bonus').$type<PromocodeBonus>().notNull(),

    userId: uuid('userId').references(() => UserTable.id, {
      onDelete: 'cascade',
    }),

    createdBy: uuid('createdBy').references(() => UserTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    expiresAtIdx: index().on(table.expiresAt),
  }),
)

export type PromocodeSelect = typeof PromocodeTable.$inferSelect
