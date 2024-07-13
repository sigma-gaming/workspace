import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  GameOutcome,
  GameRecordSelect,
  GameRecordTable,
} from '@dbs/games-schema'
import { gemFloat, gemInt } from '@games/model'
import { gamesCaches } from '@games/redis'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class GameHistoryService {
  getLastWinHistory = async () => {
    if (await gamesCaches.lastWinHistory.exists()) {
      return gamesCaches.lastWinHistory.get()
    }

    const records = await gamesDb.query.GameRecordTable.findMany({
      where: eq(GameRecordTable.outcome, GameOutcome.Win),
      orderBy: desc(GameRecordTable.createdAt),
      limit: 10,
    })

    await gamesCaches.lastWinHistory.set(records)
    return records
  }

  getBigWinHistory = async () => {
    if (await gamesCaches.bigWinHistory.exists()) {
      return gamesCaches.bigWinHistory.get()
    }

    const records = await gamesDb.query.GameRecordTable.findMany({
      where: and(
        gte(GameRecordTable.multiplier, 150),
        gte(
          sql`${GameRecordTable.bet} + ${GameRecordTable.payout}`,
          gemInt(3000),
        ),
      ),
      orderBy: desc(GameRecordTable.createdAt),
      limit: 10,
    })

    await gamesCaches.bigWinHistory.set(records)
    return records
  }

  getUserGameHistory = async (userId: string) => {
    if (await gamesCaches.userGameHistory.exists(userId)) {
      return gamesCaches.userGameHistory.get(userId)
    }

    const records = await gamesDb.query.GameRecordTable.findMany({
      where: eq(GameRecordTable.userId, userId),
      orderBy: desc(GameRecordTable.createdAt),
      limit: 10,
    })

    await gamesCaches.userGameHistory.set(userId, records)
    return records
  }

  addGameRecord = async (record: GameRecordSelect) => {
    const promises: Promise<unknown>[] = []

    promises.push(gamesCaches.userGameHistory.unshift(record.userId, record))

    console.log(record)
    if (
      gemFloat(record.bet + record.payout) >= 3000 &&
      record.multiplier >= 150
    ) {
      promises.push(gamesCaches.bigWinHistory.unshift(record))
    }

    if (record.outcome === GameOutcome.Win) {
      promises.push(gamesCaches.lastWinHistory.unshift(record))
    }

    await Promise.all(promises)
  }
}

export const gameHistoryService = createSingletonProxy(GameHistoryService)
