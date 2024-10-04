import { BadRequestException } from '@core/exceptions'
import { Game, GameOutcome } from '@dbs/games-types'
import { calculateDiceWinAmount } from '@games/model'
import { balanceService, gameService, locks } from '@games/services'
import crypto from 'node:crypto'
import { PlayDiceInput, PlayDiceOutput } from './dice.contract'

export async function playDice({
  userId,
  payload,
}: PlayDiceInput): Promise<PlayDiceOutput> {
  const { bet, sides } = payload

  return locks.with([locks.balance(userId)], async () => {
    const balance = await balanceService.getBalance(userId)

    if (balance.available < bet) {
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

    const { gameRecord, updatedBalance } = await gameService.saveGame({
      userId,
      game: Game.Dice,
      bet,
      payout,
      snapshot,
      outcome,
      balance,
    })

    return {
      record: gameRecord,
      updatedBalance: updatedBalance.available,
    }
  })
}
