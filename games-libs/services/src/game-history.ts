import { GameRecordSelect, GameRecordTable } from '@dbs/games-schema'
import { GameOutcome } from '@dbs/games-types'
import { gemFloat, gemInt } from '@games/model'
import { gamesDb } from '@games/services'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { gamesCache } from './cache'

export class GameHistoryService {
  getLastWinHistory = async () => {
    if (await gamesCache.lastWinHistory.exists()) {
      return gamesCache.lastWinHistory.get()
    }

    const records = await gamesDb.query.GameRecordTable.findMany({
      where: eq(GameRecordTable.outcome, GameOutcome.Win),
      orderBy: desc(GameRecordTable.id),
      limit: 10,
    })

    await gamesCache.lastWinHistory.set(records)
    return records
  }

  getBigWinHistory = async () => {
    if (await gamesCache.bigWinHistory.exists()) {
      return gamesCache.bigWinHistory.get()
    }

    const records = await gamesDb.query.GameRecordTable.findMany({
      where: and(
        gte(GameRecordTable.multiplier, 150),
        gte(
          sql`${GameRecordTable.bet} + ${GameRecordTable.payout}`,
          gemInt(3000),
        ),
      ),
      orderBy: desc(GameRecordTable.id),
      limit: 10,
    })

    await gamesCache.bigWinHistory.set(records)
    return records
  }

  getUserGameHistory = async (userId: string) => {
    if (await gamesCache.userGameHistory.exists(userId)) {
      return gamesCache.userGameHistory.get(userId)
    }

    const records = await gamesDb.query.GameRecordTable.findMany({
      where: eq(GameRecordTable.userId, userId),
      orderBy: desc(GameRecordTable.id),
      limit: 10,
    })

    await gamesCache.userGameHistory.set(userId, records)
    return records
  }

  addGameRecord = async (record: GameRecordSelect) => {
    const promises: Promise<unknown>[] = []

    promises.push(gamesCache.userGameHistory.unshift(record.userId, record))

    if (
      gemFloat(record.bet + record.payout) >= 3000 &&
      record.multiplier >= 150
    ) {
      promises.push(gamesCache.bigWinHistory.unshift(record))
    }

    if (record.outcome === GameOutcome.Win) {
      promises.push(gamesCache.lastWinHistory.unshift(record))
    }

    await Promise.all(promises)
  }
}

export const gameHistoryService = new GameHistoryService()
