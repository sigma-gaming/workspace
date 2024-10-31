import { BadRequestException } from '@core/exceptions'
import { BalanceTable } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { calculateDiceWinAmount } from '@games/model'
import { gamesDb, gameService } from '@games/services'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { PlayDiceInput, PlayDiceOutput } from './dice.contract'

export async function playDice({
  userId,
  payload,
}: PlayDiceInput): Promise<PlayDiceOutput> {
  const { bet, sides } = payload

  return gamesDb.transaction(async (tx) => {
    const [balance] = await tx
      .select()
      .from(BalanceTable)
      .where(eq(BalanceTable.userId, userId))
      .for('update')

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
