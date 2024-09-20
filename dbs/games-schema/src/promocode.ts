import { PromocodeBonus } from '@dbs/games-types'
import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { promocodeBonusTypeEnum } from './enums'
import { UserTable } from './user'

export const PromocodeTable = pgTable('Promocode', {
  id: uuid('id').defaultRandom().primaryKey(),
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
  bonus: json('bonus').$type<PromocodeBonus>().notNull(),

  userId: uuid('userId').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),

  createdBy: uuid('createdBy').references(() => UserTable.id, {
    onDelete: 'set null',
  }),
})

export type PromocodeSelect = typeof PromocodeTable.$inferSelect
