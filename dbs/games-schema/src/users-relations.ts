import { relations } from 'drizzle-orm'
import { AccountTable } from './accounts'
import { GameRecordTable } from './game-records'
import { ProfileTable } from './profiles'
import { SessionTable } from './sessions'
import { TransactionTable } from './transactions'
import { UserSecurityTable } from './user-security'
import { UserTable } from './users'

export const UserRelations = relations(UserTable, ({ one, many }) => ({
  profile: one(ProfileTable, {
    fields: [UserTable.profileId],
    references: [ProfileTable.id],
  }),
  accounts: many(AccountTable),
  sessions: many(SessionTable),
  transactions: many(TransactionTable),
  gameRecords: many(GameRecordTable),
  userSecurity: one(UserSecurityTable, {
    fields: [UserTable.securityId],
    references: [UserSecurityTable.id],
  }),
}))
