import { integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const UserStatsTable = pgTable('user_stats', {
  userId: uuid('user_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),

  depositCount: integer('deposit_count').notNull().default(0),
  withdrawCount: integer('withdraw_count').notNull().default(0),
})

export type UserStatsSelect = typeof UserStatsTable.$inferSelect
