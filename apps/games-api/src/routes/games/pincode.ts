import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@core/exceptions'
import { loggerService } from '@core/logger'
import { Game, GameOutcome } from '@dbs/games-types'
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

const multiplierMap: Partial<Record<number, number>> = {
  0: 250,
  1111: 250,
  1337: 111,
  1488: 111,
  2222: 250,
  3333: 250,
  4444: 250,
  5555: 250,
  6666: 250,
  7777: 250,
  8888: 250,
  9999: 250,
}

for (let code = 0; code < 10000; code++) {
  let sevenCount = 0

  for (const element of code.toString()) {
    if (element === '7') {
      sevenCount += 1
    }
  }

  if (sevenCount === 4) {
    continue
  } else if (sevenCount === 3) {
    multiplierMap[code] = 100
  } else if (sevenCount === 2) {
    multiplierMap[code] = 5
  }
}

export async function runGame(bet: number) {
  const number = crypto.randomInt(1, 10000)
  const multiplier = multiplierMap[number] ?? 0
  const hasWon = multiplier > 0
  const winAmount = Math.ceil(bet * multiplier - bet)
  return { number, multiplier, hasWon, winAmount }
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

      const { number, hasWon, winAmount } = await runGame(payload.bet)

      const payout = hasWon ? winAmount : -payload.bet

      const { gameRecord, transaction } = await gameService.saveGame({
        userId: user.id,
        game: Game.Pincode,
        bet: payload.bet,
        payout,
        snapshot: {
          game: Game.Pincode,
          outputNumber: number,
        },
        outcome: hasWon ? GameOutcome.Win : GameOutcome.Loss,
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
