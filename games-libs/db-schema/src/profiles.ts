import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accountProviderEnum } from './enums'
import { Users } from './users'

export const Profiles = pgTable('Profiles', {
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
    .references(() => Users.id)
    .notNull(),
})

export type Profile = typeof Profiles.$inferSelect
export type ProfileInsert = typeof Profiles.$inferInsert
export type ProfileUpdate = Partial<Profile>
