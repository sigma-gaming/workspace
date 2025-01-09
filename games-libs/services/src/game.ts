import { takeFirstOrThrow } from '@core/utils'
import { BalanceSelect, GameRecordTable } from '@dbs/games-schema'
import {
  Game,
  GameOutcome,
  GameSnapshot,
  PincodeMode,
  SnapshotByGame,
  TransactionType,
} from '@dbs/games-types'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { v7 } from 'uuid'
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

type GameRunnerResult<T extends Game> = {
  game: T
  payout: number
  outcome: GameOutcome
  snapshot: SnapshotByGame<T>
}

const outcomeToTypeMap: Record<GameOutcome, TransactionType> = {
  [GameOutcome.Win]: TransactionType.Win,
  [GameOutcome.Loss]: TransactionType.Loss,
}

export class GameService {
  getGameRecord = async (gameRecordId: string) => {
    const record = await gamesDb.query.GameRecordTable.findFirst({
      where: eq(GameRecordTable.id, gameRecordId),
    })

    return record ?? null
  }

  calculateWageringMultiplier = (snapshot: GameSnapshot): number => {
    if (snapshot.game === Game.Dice) {
      const sides = snapshot.inputSides.length
      return (6 / sides - 1) / 5
    }

    if (snapshot.game === Game.Pincode) {
      return snapshot.mode === PincodeMode.Easy ? 0.75 : 1
    }

    return 1
  }

  calculateWageringChange = (bet: number, snapshot: GameSnapshot): number => {
    const multiplier = this.calculateWageringMultiplier(snapshot)

    return Math.ceil(-bet * multiplier)
  }

  runGame = async <
    G extends Game,
    R extends GameRunnerResult<G> = GameRunnerResult<G>,
  >({
    runner,
    minPayout = 0,
  }: {
    runner: () => R | Promise<R>
    minPayout?: number
  }): Promise<R> => {
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
      const transactionId = v7()
      const gameRecordId = v7()

      const transaction = await balanceService.createTransaction({
        tx,
        payload: {
          id: transactionId,
          userId,
          type: outcomeToTypeMap[outcome],
          game,
          amount: payout,
          gameRecordId,
        },
      })

      const multiplier = Math.floor(Math.max(0, payout / bet) * 100)

      const gameRecord = await tx
        .insert(GameRecordTable)
        .values({
          id: gameRecordId,
          game,
          outcome,
          snapshot,
          multiplier,
          bet,
          payout,
          userId,
          previewUserName: profile.username ?? profile.name,
          transactionId,
        })
        .returning()
        .then(takeFirstOrThrow)

      const wageringChange = this.calculateWageringChange(bet, snapshot)

      const updatedBalance = await balanceService.updateBalance({
        tx,
        balance,
        transaction,
        gameRecord,
        wageringChange,
      })

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
