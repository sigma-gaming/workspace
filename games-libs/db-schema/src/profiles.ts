import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accountProviderEnum } from './enums'
import { UserTable } from './users'

export const ProfileTable = pgTable('Profile', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  name: text('name'),
  username: text('username').unique(),
  usedProvider: accountProviderEnum('usedProvider').notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
})

export type ProfileSelect = typeof ProfileTable.$inferSelect
export type ProfileInsert = typeof ProfileTable.$inferInsert
export type ProfileUpdate = Partial<ProfileSelect>
