import { AccountProvider } from '@dbs/games-types'
import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const ProfileTable = pgTable('profile', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  name: text('name').notNull(),
  hasCustomName: boolean('has_custom_name').notNull().default(false),
  username: text('username').unique(),
  image: text('image'),
  usedProvider: smallint('used_provider').$type<AccountProvider>().notNull(),

  userId: uuid('user_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
})

export type ProfileSelect = typeof ProfileTable.$inferSelect
export type ProfileInsert = typeof ProfileTable.$inferInsert
export type ProfileUpdate = Partial<ProfileSelect>
