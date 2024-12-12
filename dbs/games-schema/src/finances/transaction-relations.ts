import { relations } from 'drizzle-orm'
import { GameRecordTable } from '../games/game-record'
import { UserTable } from '../user/user'
import { TransactionTable } from './transaction'

export const TransactionRelations = relations(TransactionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [TransactionTable.userId],
    references: [UserTable.id],
  }),
  gameRecord: one(GameRecordTable, {
    fields: [TransactionTable.gameRecordId],
    references: [GameRecordTable.id],
  }),
}))
