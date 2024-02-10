import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@libs/exceptions'
import { Game, TransactionType } from '@games/db-schema'
import { rub } from '@games/model'
import { gamesCaches } from '@games/redis'
import {
  budgetService,
  sessionService,
  transactionService,
} from '@games/services'
import { logger } from '@libs/logger'
import crypto from 'node:crypto'
import { z } from 'zod'
import { procedure } from '../trpc'

const rtpMultiplier = 0.96

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

export const dices = procedure
  .input(
    z.object({
      bet: z.number().int(),
      sides: z.array(z.number().int().min(1).max(6)).min(1).max(6),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const user = sessionService.getUser(ctx.session)

    if (input.bet < rub(1)) {
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

      if (lastBalance < input.bet) {
        throw new BadRequestException({
          path: ['bet'],
          message: 'Голда не на балике',
        })
      }

      const { hasWon, winAmount, side } = await runGame(input.bet, input.sides)
      const amount = hasWon ? winAmount : -input.bet
      const rtp = amount + input.bet
      const won = hasWon ? winAmount : 0
      const lost = hasWon ? 0 : input.bet

      const newTransaction = await transactionService.createTransaction(
        user.id,
        {
          type: hasWon ? TransactionType.Win : TransactionType.Loss,
          game: Game.Dice,
          amount,
          openingBalance: lastBalance,
          closingBalance: lastBalance + amount,
          totalBet: totalBet + input.bet,
          totalWon: totalWon + won,
          totalLost: totalLost + lost,
          totalRTP: totalRTP + rtp,
        },
      )

      return {
        status: 'success',
        side,
        amount,
        updatedBalance: newTransaction.closingBalance,
      }
    } catch (error) {
      if (error instanceof RouteException) {
        throw error
      }

      logger.error(error)
      throw new InternalServerException()
    } finally {
      await lock.release()
    }
  })
