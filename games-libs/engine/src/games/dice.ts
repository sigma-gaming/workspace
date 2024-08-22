import { BadRequestException } from '@core/exceptions'
import { Game, GameOutcome } from '@dbs/games-types'
import { calculateDiceWinAmount } from '@games/model'
import { gameService, locks, transactionService } from '@games/services'
import crypto from 'node:crypto'
import { PlayDiceInput, PlayDiceOutput } from './dice.contract'

export async function playDice({
  userId,
  payload,
}: PlayDiceInput): Promise<PlayDiceOutput> {
  const { bet, sides } = payload

  return locks.with([locks.transaction(userId)], async () => {
    const lastTransaction = await transactionService.getLastTransaction(userId)

    const { closingBalance: lastBalance = 0 } = lastTransaction ?? {}

    if (lastBalance < bet) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Недостаточно гемов',
      })
    }

    const { payout, outcome, snapshot } = await gameService.runGame({
      runner: () => {
        const uniqueSides = new Set(sides)
        const winAmount = calculateDiceWinAmount(bet, sides)

        const side = crypto.randomInt(1, 7)

        const outcome = uniqueSides.has(side)
          ? GameOutcome.Win
          : GameOutcome.Loss

        const payout = outcome === GameOutcome.Win ? winAmount : -bet

        return {
          outcome,
          payout,
          snapshot: { game: Game.Dice, inputSides: sides, outputSide: side },
        }
      },
    })

    const { gameRecord, transaction } = await gameService.saveGame({
      userId,
      game: Game.Dice,
      bet,
      payout,
      snapshot,
      outcome,
      previousTransaction: lastTransaction,
    })

    return {
      record: gameRecord,
      updatedBalance: transaction.closingBalance,
    }
  })
}
