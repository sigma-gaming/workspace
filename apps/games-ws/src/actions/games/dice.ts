import {
  BadRequestException,
  InternalServerException,
  NotAuthenticatedException,
  RouteException,
} from '@core/exceptions'
import { loggerService } from '@core/logger'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
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
import { Context } from '../../context'
import { createWsAction } from '../../ws-action'

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

const InputSchema = z.object({
  bet: z.number().int(),
  sides: z.array(z.number().int().min(1).max(6)).min(1).max(5),
})

export type GamesDiceInput = z.infer<typeof InputSchema>

export type GamesDiceOutput = {
  updatedBalance: number
  record: GameRecordSelect
}

export const GamesDiceAction = createWsAction({
  name: 'games/dice',
  schema: InputSchema,
  async handler(ctx: Context, { bet, sides }) {
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

      const { hasWon, winAmount, side } = await runGame(bet, sides)

      const payout = hasWon ? winAmount : -bet

      const { gameRecord, transaction } = await gameService.saveGame({
        userId: session.user.id,
        game: Game.Dice,
        bet,
        payout,
        snapshot: {
          game: Game.Dice,
          inputSides: sides,
          outputSide: side,
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
    const session = await sessionService.getHonoSession(ctx)
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
          message: 'Недостаточно гемов',
        })
      }

      const { hasWon, winAmount, side } = await runGame(
        payload.bet,
        payload.sides,
      )

      const payout = hasWon ? winAmount : -payload.bet

      const { gameRecord, transaction } = await gameService.saveGame({
        userId: user.id,
        game: Game.Dice,
        bet: payload.bet,
        payout,
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
