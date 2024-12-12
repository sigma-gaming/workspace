import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { ReferrerSettingsTable } from './referrer-settings'

export const ReferrerSettingsRelations = relations(
  ReferrerSettingsTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerSettingsTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
