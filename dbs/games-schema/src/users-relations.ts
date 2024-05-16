import { relations } from 'drizzle-orm'
import { AccountTable } from './accounts'
import { ProfileTable } from './profiles'
import { SessionTable } from './sessions'
import { TransactionTable } from './transactions'
import { UserTable } from './users'

export const UserRelations = relations(UserTable, ({ one, many }) => ({
  profile: one(ProfileTable, {
    fields: [UserTable.profileId],
    references: [ProfileTable.id],
  }),
  accounts: many(AccountTable),
  sessions: many(SessionTable),
  transactions: many(TransactionTable),
}))
