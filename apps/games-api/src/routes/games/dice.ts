import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@core/exceptions'
import { loggerService } from '@core/logger'
import { Game, GameOutcome } from '@dbs/games-schema'
import { calculateDiceWinAmount, gemInt } from '@games/model'
import {
  budgetService,
  gameService,
  sessionService,
  transactionService,
} from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import crypto from 'node:crypto'
import { z } from 'zod'

export async function runGame(bet: number, sides: number[]) {
  const unwantedLoss = await budgetService.getUnwantedLoss()
  const maxLoss = await budgetService.getMaxLoss()
  const uniqueSides = new Set(sides)
  const winAmount = calculateDiceWinAmount(bet, sides)

  let tries = 1
  if (winAmount > unwantedLoss) tries = 2
  if (winAmount > maxLoss) tries = Infinity

  for (let i = 1; i <= tries; i++) {
    const side = crypto.randomInt(1, 7)
    const hasWon = uniqueSides.has(side)

    if (hasWon && i < tries) {
      continue
    }

    return { side, hasWon, winAmount }
  }

  throw new Error('Unreachable')
}

export const playDiceRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      bet: z.number().int(),
      sides: z.array(z.number().int().min(1).max(6)).min(1).max(5),
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

      const { hasWon, winAmount, side } = await runGame(
        payload.bet,
        payload.sides,
      )

      const amount = hasWon ? winAmount : -payload.bet

      const { gameRecord, transaction } = await gameService.saveGame({
        userId: user.id,
        game: Game.Dice,
        bet: payload.bet,
        payout: amount,
        snapshot: {
          game: Game.Dice,
          inputSides: payload.sides,
          outputSide: side,
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
