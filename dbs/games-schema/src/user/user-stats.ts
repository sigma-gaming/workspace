import { integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const UserStatsTable = pgTable('UserStats', {
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),

  depositCount: integer('depositCount').notNull().default(0),
  withdrawCount: integer('withdrawCount').notNull().default(0),
})

export type UserStatsSelect = typeof UserStatsTable.$inferSelect
