import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  BalanceSelect,
  GameRecordTable,
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
import { BalanceService } from './balance'
import { budgetService } from './budget'
import { GameHistoryService } from './game-history'
import { ProfileService } from './profile'

type SaveGamePayload = {
  userId: string
  game: Game
  bet: number
  payout: number
  snapshot: GameSnapshot
  outcome: GameOutcome
  balance: BalanceSelect
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
    private readonly transactionService: BalanceService,
  ) {}

  lock = async (userId: string, ms = 3000) => {
    return gamesCaches.balance.lock(userId, ms)
  }

  getGameRecord = async (gameRecordId: number) => {
    const record = await gamesDb.query.GameRecordTable.findFirst({
      where: eq(GameRecordTable.id, gameRecordId),
    })

    return record ?? null
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
    balance,
  }: SaveGamePayload) => {
    const profile = await this.profileService.getDetailedProfile(userId)

    const { gameRecord, updatedBalance } = await gamesDb.transaction(
      async (tx) => {
        const transaction = await this.transactionService.createTransaction({
          tx,
          payload: {
            userId,
            type: outcomeToTypeMap[outcome],
            game,
            amount: payout,
          },
        })

        const multiplier = Math.floor(Math.max(0, payout / bet) * 100)

        const [gameRecord] = await tx
          .insert(GameRecordTable)
          .values({
            game,
            outcome,
            snapshot,
            multiplier,
            bet,
            payout,
            userId,
            previewUserName: profile.username ?? profile.name,
            transactionId: transaction.id,
          })
          .returning()

        const updatedBalance = await this.transactionService.updateBalance({
          tx,
          balance,
          transaction,
          gameRecord,
          wageringChange: -bet,
        })

        await tx
          .update(TransactionTable)
          .set({ gameRecordId: gameRecord.id })
          .where(eq(TransactionTable.id, transaction.id))

        await gamesCaches.balance.set(userId, updatedBalance)

        return { gameRecord, updatedBalance }
      },
    )

    budgetService.changeAvailable(-payout)
    this.gameHistoryService.addGameRecord(gameRecord)

    return { gameRecord, updatedBalance }
  }
}

export const gameService = createSingletonProxy(GameService)
