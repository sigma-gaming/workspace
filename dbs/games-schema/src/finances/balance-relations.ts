import { relations } from 'drizzle-orm'
import { GameRecordTable } from '../games/game-record'
import { UserTable } from '../user/user'
import { BalanceTable } from './balance'

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
