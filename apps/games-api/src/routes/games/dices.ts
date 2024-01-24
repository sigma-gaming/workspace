import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@libs/exceptions'
import { Game, rub, TransactionType } from '@libs/games-model'
import crypto from 'node:crypto'
import { z } from 'zod'
import { lastTransactionCache } from '../../caches/transaction'
import { BudgetService } from '../../services/budget'
import { SessionService } from '../../services/session'
import { TransactionService } from '../../services/transaction'
import { logger } from '../../shared/logger'
import { procedure } from '../trpc'

const rtp = 0.96

export async function runGame(bet: number, sides: number[]) {
  const { unwantedLoss, maxLoss } = await BudgetService.getBudget()
  const uniqueSides = new Set(sides)
  const multiplier = (6 / uniqueSides.size) * rtp
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

let replicaCount = 0

export const dices = procedure
  .input(
    z.object({
      bet: z.number().int(),
      sides: z.array(z.number().int().min(1).max(6)).min(1).max(6),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const user = SessionService.getUser(ctx.session)

    if (input.bet < rub(1)) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Минимальная ставка - 1 рубль',
      })
    }

    const lock = await lastTransactionCache.lock(user.id, 10000)

    replicaCount += 1

    try {
      const lastTransaction = await TransactionService.getLastTransaction(
        user.id,
      )

      const lastBalance = lastTransaction?.closingBalance ?? 0

      if (lastBalance < input.bet) {
        throw new BadRequestException({
          path: ['bet'],
          message: 'Голда не на балике',
        })
      }

      const { hasWon, winAmount, side } = await runGame(input.bet, input.sides)
      const amount = hasWon ? winAmount : -input.bet

      const newTransaction = await TransactionService.createTransaction(
        user.id,
        {
          type: hasWon ? TransactionType.Win : TransactionType.Loss,
          game: Game.Dice,
          amount,
          openingBalance: lastBalance,
          closingBalance: lastBalance + amount,
        },
      )

      return {
        status: 'success',
        side,
        amount,
        updatedBalance: newTransaction.closingBalance,
        replicaCount,
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
