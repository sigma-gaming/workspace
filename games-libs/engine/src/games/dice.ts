import { BadRequestException } from '@core/exceptions'
import { takeFirstOrThrow } from '@core/utils'
import { BalanceTable } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { calculateDiceMultiplier, calculateDiceWinAmount } from '@games/model'
import { gamesDb, gameService } from '@games/services'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { PlayDiceInput, PlayDiceOutput } from './dice.contract'

export async function playDice({
  userId,
  payload,
}: PlayDiceInput): Promise<PlayDiceOutput> {
  const { bet, sides: sidesRaw } = payload

  return gamesDb.transaction(async (tx) => {
    const balance = await tx
      .select()
      .from(BalanceTable)
      .where(eq(BalanceTable.userId, userId))
      .for('update')
      .then(takeFirstOrThrow)

    if (balance.available < bet) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Недостаточно гемов',
      })
    }

    const { payout, outcome, snapshot } = await gameService.runGame({
      runner: () => {
        const sides = new Set(sidesRaw)
        const multiplier = calculateDiceMultiplier(sides)
        const winAmount = calculateDiceWinAmount(bet, sides, multiplier)

        const side = crypto.randomInt(1, 7)

        const outcome = sides.has(side) ? GameOutcome.Win : GameOutcome.Loss

        const payout = outcome === GameOutcome.Win ? winAmount : -bet

        return {
          game: Game.Dice,
          outcome,
          payout,
          snapshot: {
            game: Game.Dice,
            inputSides: Array.from(sides),
            outputSide: side,
          },
        }
      },
    })

    const { gameRecord, updatedBalance } = await gameService.saveGame({
      tx,
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
