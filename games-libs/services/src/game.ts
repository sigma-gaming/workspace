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
import { gamesCaches } from '@games/redis'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { budgetService } from './budget'
import { GameHistoryService } from './game-history'
import { ProfileService } from './profile'
import { TransactionService } from './transaction'

type SaveGamePayload = {
  userId: string
  game: Game
  bet: number
  payout: number
  snapshot: GameSnapshot
  outcome: GameOutcome
  previousTransaction?: TransactionSelect | null
}

type GameRunnerResult = {
  snapshot: GameSnapshot
  outcome: GameOutcome
  payout: number
}

const outcomeToTypeMap: Record<GameOutcome, TransactionType> = {
  [GameOutcome.Win]: TransactionType.Win,
  [GameOutcome.Loss]: TransactionType.Loss,
}

@singleton()
export class GameService {
  constructor(
    private readonly gameHistoryService: GameHistoryService,
    private readonly profileService: ProfileService,
    private readonly transactionService: TransactionService,
  ) {}

  lock = async (userId: string, ms = 3000) => {
    return gamesCaches.lastTransaction.lock(userId, ms)
  }

  runGame = async ({
    runner,
    minPayout = 0,
  }: {
    runner: () => GameRunnerResult | Promise<GameRunnerResult>
    minPayout?: number
  }): Promise<GameRunnerResult> => {
    const availableBudget = await budgetService.getAvailable()

    if (minPayout > availableBudget) {
      throw new Error('Budget is not enough')
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await runner()

      if (result.payout > availableBudget) {
        continue
      }

      return result
    }
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

    const { gameRecord, transaction } = await gamesDb.transaction(
      async (tx) => {
        const [{ id: transactionId }] =
          await this.transactionService.createTransaction({
            tx,
            payload: this.transactionService.generateGameTransaction(
              previousTransaction,
              {
                userId,
                type: outcomeToTypeMap[outcome],
                game,
                amount: payout,
                bet,
              },
            ),
          })

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

    budgetService.changeAvailable(-payout)
    this.gameHistoryService.addGameRecord(gameRecord)

    await gamesCaches.lastTransaction.set(userId, transaction)

    return { gameRecord, transaction }
  }
}

export const gameService = createSingletonProxy(GameService)
