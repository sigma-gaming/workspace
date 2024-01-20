import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@libs/exceptions'
import { TransactionType } from '@libs/games-model'
import crypto from 'node:crypto'
import { z } from 'zod'
import { SessionService } from '../../services/session'
import { TransactionService } from '../../services/transaction'
import { redlock } from '../../shared/redis'
import { procedure } from '../trpc'

function getRandomIntInclusive(min: number, max: number) {
  const randomBuffer = new Uint32Array(1)

  crypto.getRandomValues(randomBuffer)

  const randomNumber = randomBuffer[0] / (0xffffffff + 1)

  return Math.floor(randomNumber * (max - min + 1)) + min
}

export const dices = procedure
  .input(
    z.object({
      bet: z.number(),
      sides: z.array(z.number().int().min(1).max(6)).min(1).max(6),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const user = SessionService.getUser(ctx.session)

    if (input.bet < 100) {
      throw new BadRequestException({
        path: ['bet'],
        message: 'Минимальная ставка - 1 рубль',
      })
    }

    const lock = await redlock.acquire([`transactions-${user.id}`], 10000)

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

      const uniqueSides = new Set(input.sides)
      const multiplier = (6 / uniqueSides.size) * 0.99

      const side = getRandomIntInclusive(1, 6)
      const hasWon = uniqueSides.has(side)

      let diff = -input.bet
      if (hasWon) diff += input.bet * multiplier

      const newTransaction = await TransactionService.createTransaction(
        user.id,
        {
          type: hasWon ? TransactionType.Win : TransactionType.Loss,
          amount: diff,
          openingBalance: lastBalance,
          closingBalance: lastBalance + diff,
        },
      )

      return {
        status: 'success',
        updatedBalance: newTransaction.closingBalance,
      }
    } catch (error) {
      if (error instanceof RouteException) {
        throw error
      }

      console.log(error)
      ctx.req.log.error(error)
      throw new InternalServerException()
    } finally {
      await lock.release()
    }
  })
