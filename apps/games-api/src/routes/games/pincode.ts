import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@core/exceptions'
import { loggerService } from '@core/logger'
import { Game, GameOutcome } from '@dbs/games-schema'
import { gemInt } from '@games/model'
import {
  gameService,
  sessionService,
  transactionService,
} from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import crypto from 'node:crypto'
import { z } from 'zod'

export async function runGame() {
  const number = crypto.randomInt(1, 10000)
  return { number }
}

export const playPincodeRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      bet: z.number().int(),
    }),
  ),
  async (ctx) => {
    const logger = loggerService.forRequest(ctx.req)
    const payload = ctx.req.valid('json')
    const session = await sessionService.getHonoSession(ctx.req)
    const user = sessionService.getUser(session)

    if (payload.bet < gemInt(1)) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Минимальная ставка - 1 гем',
      })
    }

    const lock = await transactionService.lock(user.id)

    try {
      const lastTransaction = await transactionService.getLastTransaction(
        user.id,
      )

      const { closingBalance: lastBalance = 0 } = lastTransaction ?? {}

      if (lastBalance < payload.bet) {
        throw new BadRequestException({
          path: ['bet'],
          message: 'Голда не на балике',
        })
      }

      const { number } = await runGame()

      const { gameRecord, transaction } = await gameService.saveGame({
        userId: user.id,
        game: Game.Pincode,
        bet: payload.bet,
        payout: 0,
        snapshot: {
          game: Game.Pincode,
          outputNumber: number,
        },
        outcome: GameOutcome.Win,
        previousTransaction: lastTransaction,
      })

      return ctx.json({
        status: 'success',
        record: gameRecord,
        updatedBalance: transaction.closingBalance,
      })
    } catch (error) {
      if (error instanceof RouteException) {
        throw error
      }

      logger.error(error)
      throw new InternalServerException()
    } finally {
      await lock.release()
    }
  },
)
