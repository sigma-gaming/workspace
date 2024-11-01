import { BadRequestException } from '@core/exceptions'
import { BalanceTable } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { getPincodeMultiplier } from '@games/model'
import { gamesDb, gameService } from '@games/services'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { PlayPincodeInput, PlayPincodeOutput } from './pincode.contract'

export async function playPincode({
  userId,
  payload,
}: PlayPincodeInput): Promise<PlayPincodeOutput> {
  const { bet, mode } = payload

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
        const number = crypto.randomInt(10000)
        const multiplier = getPincodeMultiplier(mode, number)
        const outcome = multiplier > 0 ? GameOutcome.Win : GameOutcome.Loss
        const winAmount = Math.ceil(bet * multiplier - bet)
        const payout = outcome === GameOutcome.Win ? winAmount : -bet

        return {
          outcome,
          payout,
          snapshot: {
            game: Game.Pincode,
            outputNumber: number,
          },
        }
      },
    })

    const { gameRecord, updatedBalance } = await gameService.saveGame({
      tx,
      userId,
      game: Game.Pincode,
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
