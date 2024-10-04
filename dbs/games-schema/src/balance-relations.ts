import { relations } from 'drizzle-orm'
import { BalanceTable } from './balance'
import { GameRecordTable } from './game-record'
import { UserTable } from './user'

export const BalanceRelations = relations(BalanceTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [BalanceTable.userId],
    references: [UserTable.id],
  }),
  maxWinGame: one(GameRecordTable, {
    fields: [BalanceTable.maxWinGameId],
    references: [GameRecordTable.id],
  }),
  maxMultiplierGame: one(GameRecordTable, {
    fields: [BalanceTable.maxMultiplierGameId],
    references: [GameRecordTable.id],
  }),
}))
