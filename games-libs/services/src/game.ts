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
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { balanceService } from './balance'
import { budgetService } from './budget'
import { gamesCache } from './cache'
import { gameHistoryService } from './game-history'
import { profileService } from './profile'

type SaveGamePayload = {
  tx?: typeof gamesDb
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

export class GameService {
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
    tx = gamesDb,
    userId,
    game,
    bet,
    payout,
    snapshot,
    outcome,
    balance,
  }: SaveGamePayload) => {
    const profile = await profileService.getDetailedProfile(userId)

    const saveGame = async (tx: typeof gamesDb) => {
      const transaction = await balanceService.createTransaction({
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

      const updatedBalance = await balanceService.updateBalance({
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

      return { gameRecord, updatedBalance }
    }

    const { gameRecord, updatedBalance } = tx
      ? await saveGame(tx)
      : await gamesDb.transaction(saveGame)

    if (gamesCache.ready) {
      await gamesCache.balance.set(userId, updatedBalance)
      budgetService.changeAvailable(-payout)
      gameHistoryService.addGameRecord(gameRecord)
    }

    return { gameRecord, updatedBalance }
  }
}

export const gameService = new GameService()
