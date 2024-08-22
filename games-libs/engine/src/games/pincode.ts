import { BadRequestException } from '@core/exceptions'
import { Game, GameOutcome } from '@dbs/games-types'
import { getPincodeMultiplier } from '@games/model'
import { gameService, locks, transactionService } from '@games/services'
import crypto from 'node:crypto'
import { PlayPincodeInput, PlayPincodeOutput } from './pincode.contract'

export async function playPincode({
  userId,
  payload,
}: PlayPincodeInput): Promise<PlayPincodeOutput> {
  const { bet, mode } = payload

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

    const { gameRecord, transaction } = await gameService.saveGame({
      userId,
      game: Game.Pincode,
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
