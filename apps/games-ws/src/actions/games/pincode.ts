import {
  BadRequestException,
  NotAuthenticatedException,
} from '@core/exceptions'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { gemInt, getPincodeMultiplier } from '@games/model'
import { gameService, transactionService } from '@games/services'
import crypto from 'node:crypto'
import { z } from 'zod'
import { Context } from '../../context'
import { createWsAction } from '../../ws-action'

export function runGame(bet: number) {
  const number = crypto.randomInt(10000)
  const multiplier = getPincodeMultiplier(number)
  const hasWon = multiplier > 0
  const winAmount = Math.ceil(bet * multiplier - bet)
  return { number, multiplier, hasWon, winAmount }
}

const InputSchema = z.object({
  bet: z.number().int(),
})

export type GamesPincodeInput = z.infer<typeof InputSchema>

export type GamesPincodeOutput = {
  updatedBalance: number
  record: GameRecordSelect
}

export const GamesPincodeAction = createWsAction({
  name: 'games/pincode',
  schema: InputSchema,
  async handler(ctx: Context, { bet }): Promise<GamesPincodeOutput> {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    if (bet < gemInt(1)) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Минимальная ставка - 1 гем',
      })
    }

    const lock = await transactionService.lock(session.user.id)

    try {
      const lastTransaction = await transactionService.getLastTransaction(
        session.user.id,
      )

      const { closingBalance: lastBalance = 0 } = lastTransaction ?? {}

      if (lastBalance < bet) {
        throw new BadRequestException({
          path: ['bet'],
          message: 'Недостаточно гемов',
        })
      }

      const { number, hasWon, winAmount } = runGame(bet)

      const payout = hasWon ? winAmount : -bet

      const { gameRecord, transaction } = await gameService.saveGame({
        userId: session.user.id,
        game: Game.Pincode,
        bet,
        payout,
        snapshot: {
          game: Game.Pincode,
          outputNumber: number,
        },
        outcome: hasWon ? GameOutcome.Win : GameOutcome.Loss,
        previousTransaction: lastTransaction,
      })

      return {
        record: gameRecord,
        updatedBalance: transaction.closingBalance,
      }
    } finally {
      await lock.release()
    }
  },
})
