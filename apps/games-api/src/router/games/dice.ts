import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@core/exceptions'
import { loggerService } from '@core/logger'
import { Game, TransactionType } from '@dbs/games-schema'
import { rub } from '@games/model'
import { gamesCaches } from '@games/redis'
import {
  budgetService,
  sessionService,
  transactionService,
} from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import crypto from 'node:crypto'
import { z } from 'zod'

const rtpMultiplier = 0.95

export async function runGame(bet: number, sides: number[]) {
  const { unwantedLoss, maxLoss } = await budgetService.getBudget()
  const uniqueSides = new Set(sides)
  const multiplier = (6 / uniqueSides.size) * rtpMultiplier
  const winAmount = Math.ceil(bet * multiplier - bet)

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
      sides: z.array(z.number().int().min(1).max(6)).min(1).max(6),
    }),
  ),
  async (ctx) => {
    const logger = loggerService.forRequest(ctx.req)
    const payload = ctx.req.valid('json')
    const session = await sessionService.getSession(ctx.req)
    const user = sessionService.getUser(session)

    if (payload.bet < rub(1)) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Минимальная ставка - 1 рубль',
      })
    }

    const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

    try {
      const lastTransaction = await transactionService.getLastTransaction(
        user.id,
      )

      const {
        closingBalance: lastBalance = 0,
        totalBet = 0,
        totalWon = 0,
        totalLost = 0,
        totalRTP = 0,
      } = lastTransaction ?? {}

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
      const rtp = amount + payload.bet
      const won = hasWon ? winAmount : 0
      const lost = hasWon ? 0 : payload.bet

      logger.info('Test message', { amount, side })

      const transactionType = hasWon
        ? TransactionType.Win
        : TransactionType.Loss

      const newTransaction = await transactionService.createTransaction(
        user.id,
        {
          type: transactionType,
          game: Game.Dice,
          amount,
          openingBalance: lastBalance,
          closingBalance: lastBalance + amount,
          totalBet: totalBet + payload.bet,
          totalWon: totalWon + won,
          totalLost: totalLost + lost,
          totalRTP: totalRTP + rtp,
        },
      )

      return ctx.json({
        status: 'success',
        transactionId: newTransaction.id,
        transactionType,
        side,
        amount,
        openingBalance: newTransaction.openingBalance,
        closingBalance: newTransaction.closingBalance,
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
