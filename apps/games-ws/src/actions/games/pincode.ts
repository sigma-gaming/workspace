import {
  BadRequestException,
  NotAuthenticatedException,
} from '@core/exceptions'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { gemInt, getPincodeMultiplier, PincodeMode } from '@games/model'
import { gameService, transactionService } from '@games/services'
import crypto from 'node:crypto'
import { z } from 'zod'
import { Context } from '../../context'
import { createWsAction } from '../../ws-action'

const InputSchema = z.object({
  bet: z.number().int(),
  mode: z.nativeEnum(PincodeMode),
})

export type GamesPincodeInput = z.infer<typeof InputSchema>

export type GamesPincodeOutput = {
  updatedBalance: number
  record: GameRecordSelect
}

export const GamesPincodeAction = createWsAction({
  name: 'games/pincode',
  schema: InputSchema,
  async handler(ctx: Context, { bet, mode }): Promise<GamesPincodeOutput> {
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
        userId: session.user.id,
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
    } finally {
      await lock.release()
    }
  },
})
