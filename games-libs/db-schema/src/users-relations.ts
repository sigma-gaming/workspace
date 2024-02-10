import { relations } from 'drizzle-orm'
import { Accounts } from './accounts'
import { Profiles } from './profiles'
import { Sessions } from './sessions'
import { Transactions } from './transactions'
import { Users } from './users'

export const UsersRelations = relations(Users, ({ one, many }) => ({
  profile: one(Profiles, {
    fields: [Users.profileId],
    references: [Profiles.id],
  }),
  accounts: many(Accounts),
  sessions: many(Sessions),
  transactions: many(Transactions),
}))
