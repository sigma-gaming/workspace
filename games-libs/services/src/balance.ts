import {
  BalanceSelect,
  BalanceTable,
  GameRecordSelect,
  TransactionInsert,
  TransactionSelect,
  TransactionTable,
  UserSelect,
} from '@dbs/games-schema'
import { TransactionType } from '@dbs/games-types'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { gamesCache } from './cache'

type TransactionInsertWithUserId = TransactionInsert & {
  userId: UserSelect['id']
}

export class BalanceService {
  lock = async (userId: string, ms = 3000) => {
    return gamesCache.balance.lock(userId, ms)
  }

  getBalance = async (userId: string): Promise<BalanceSelect> => {
    const cached = await gamesCache.balance.get(userId)

    if (cached) {
      return cached
    }

    const balance = await gamesDb.query.BalanceTable.findFirst({
      where: eq(BalanceTable.userId, userId),
    })

    if (!balance) {
      throw new Error('Balance not found (should not happen)')
    }

    await gamesCache.balance.set(userId, balance)

    return balance
  }

  async createTransaction({
    tx,
    payload,
  }: {
    tx?: typeof gamesDb
    payload: TransactionInsertWithUserId
  }) {
    const db = tx ?? gamesDb

    const [transaction] = await db
      .insert(TransactionTable)
      .values(payload)
      .returning()

    return transaction
  }

  async updateBalance({
    tx,
    balance,
    transaction,
    gameRecord,
    wageringChange = 0,
  }: {
    tx?: typeof gamesDb
    balance: BalanceSelect
    transaction: TransactionSelect
    wageringChange?: number
    gameRecord?: GameRecordSelect
  }) {
    if (!transaction.userId) {
      throw new Error('transaction.userId is missing - should not happen')
    }

    function assertGameRecord(
      gameRecord?: GameRecordSelect,
    ): asserts gameRecord is GameRecordSelect {
      if (gameRecord) return
      throw new Error('GameRecord is required for game transactions')
    }

    const db = tx ?? gamesDb

    let {
      available,
      wageringRequired,
      totalBet,
      totalWon,
      totalLost,
      totalBetCount,
      maxWin,
      maxMultiplier,
      maxWinGameId,
      maxMultiplierGameId,
    } = balance

    available += transaction.amount
    wageringRequired = Math.max(0, wageringRequired + wageringChange)

    if (transaction.type === TransactionType.Win) {
      assertGameRecord(gameRecord)
      const won = transaction.amount
      totalBet += gameRecord.bet
      totalWon += won
      totalBetCount += 1

      if (won > maxWin) {
        maxWin = won
        maxWinGameId = gameRecord.id
      }

      if (gameRecord.multiplier > maxMultiplier) {
        maxMultiplier = gameRecord.multiplier
        maxMultiplierGameId = gameRecord.id
      }
    }

    if (transaction.type === TransactionType.Loss) {
      assertGameRecord(gameRecord)
      const lost = -transaction.amount
      totalBet += gameRecord.bet
      totalLost += lost
      totalBetCount += 1
    }

    const [updatedBalance] = await db
      .update(BalanceTable)
      .set({
        available,
        wageringRequired,
        totalBet,
        totalWon,
        totalLost,
        totalBetCount,
        maxWin,
        maxMultiplier,
        maxWinGameId,
        maxMultiplierGameId,
      })
      .where(eq(BalanceTable.userId, transaction.userId))
      .returning()

    return updatedBalance
  }
}

export const balanceService = new BalanceService()
