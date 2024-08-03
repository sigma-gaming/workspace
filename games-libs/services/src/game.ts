import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  GameRecordTable,
  TransactionSelect,
  TransactionTable,
} from '@dbs/games-schema'
import {
  Game,
  GameOutcome,
  GameSnapshot,
  TransactionType,
} from '@dbs/games-types'
import { gemInt } from '@games/model'
import { gamesCaches } from '@games/redis'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { GameHistoryService } from './game-history'
import { ProfileService } from './profile'

type SaveGamePayload = {
  userId: string
  game: Game
  bet: number
  payout: number
  snapshot: GameSnapshot
  outcome: GameOutcome
  previousTransaction?: TransactionSelect | null
}

@singleton()
export class GameService {
  constructor(
    private readonly gameHistoryService: GameHistoryService,
    private readonly profileService: ProfileService,
  ) {}

  lock = async (userId: string, ms = 3000) => {
    return gamesCaches.lastTransaction.lock(userId, ms)
  }

  saveGame = async ({
    userId,
    game,
    bet,
    payout,
    snapshot,
    outcome,
    previousTransaction,
  }: SaveGamePayload) => {
    const profile = await this.profileService.getDetailedProfile(userId)

    const {
      closingBalance: lastBalance = 0,
      totalBet = 0,
      totalWon = 0,
      totalLost = 0,
      totalRTP = 0,
      wageringRequired = 0,
    } = previousTransaction ?? {}

    const rtp = payout + bet
    const won = Math.max(0, payout)
    const lost = Math.min(0, payout)

    const { gameRecord, transaction } = await gamesDb.transaction(
      async (tx) => {
        const closingBalance = lastBalance + payout

        const [{ id: transactionId }] = await tx
          .insert(TransactionTable)
          .values({
            userId,
            type: outcome as unknown as TransactionType,
            game,
            amount: payout,
            openingBalance: lastBalance,
            closingBalance,
            totalBet: totalBet + bet,
            totalWon: totalWon + won,
            totalLost: totalLost + lost,
            totalRTP: totalRTP + rtp,
            wageringRequired:
              closingBalance <= gemInt(1) ? 0 : wageringRequired - bet,
          })
          .returning()

        const [gameRecord] = await tx
          .insert(GameRecordTable)
          .values({
            game,
            outcome,
            snapshot,
            multiplier: Math.floor(Math.max(0, payout / bet) * 100),
            bet,
            payout,
            userId,
            previewUserName: profile.username ?? profile.name,
            transactionId,
          })
          .returning()

        const [transaction] = await tx
          .update(TransactionTable)
          .set({ gameRecordId: gameRecord.id })
          .where(eq(TransactionTable.id, transactionId))
          .returning()

        return { gameRecord, transaction }
      },
    )

    await gamesCaches.lastTransaction.set(userId, transaction)
    await this.gameHistoryService.addGameRecord(gameRecord)
    return { gameRecord, transaction }
  }
}

export const gameService = createSingletonProxy(GameService)
