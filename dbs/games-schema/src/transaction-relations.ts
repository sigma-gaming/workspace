import { relations } from 'drizzle-orm'
import { GameRecordTable } from './game-record'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

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
