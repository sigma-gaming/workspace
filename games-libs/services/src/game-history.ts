import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  GameOutcome,
  GameRecordSelect,
  GameRecordTable,
} from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import { desc, eq } from 'drizzle-orm'
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

  addGameRecord = async (gameRecord: GameRecordSelect) => {
    const promises = [
      gamesCaches.userGameHistory.unshift(gameRecord.userId, gameRecord),

      gameRecord.outcome === GameOutcome.Win &&
        gamesCaches.lastWinHistory.unshift(gameRecord),
    ].filter(Boolean)

    await Promise.all(promises)
  }
}

export const gameHistoryService = createSingletonProxy(GameHistoryService)
