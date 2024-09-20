import { relations } from 'drizzle-orm'
import { ReferrerSettingsTable } from './referrer-settings'
import { UserTable } from './user'

export const ReferrerSettingsRelations = relations(
  ReferrerSettingsTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerSettingsTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
