import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'
import { gemInt } from '@games/model'
import { PaymentResult, paymentService, sessionService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../hono'

const PayloadSchema = z.object({
  amount: z.number().min(gemInt(1)),
  provider: z.nativeEnum(PaymentProvider),
  method: z.nativeEnum(DepositMethod),
  currency: z.nativeEnum(Currency),
  redirectUrl: z.string().url(),
})

export const depositRoute = createRouter().post(
  '/',
  zValidator('json', PayloadSchema),
  async (ctx) => {
    const { userId } = await sessionService.getHonoSession(ctx)
    const { amount, provider, method, currency, redirectUrl } =
      ctx.req.valid('json')

    const result = await paymentService.createDeposit({
      userId,
      amount,
      provider,
      method,
      currency,
      redirectUrl,
      userIp: ctx.env.ip,
    })

    switch (result.result) {
      case PaymentResult.Success:
        return ctx.json({
          transactionId: result.transactionId,
          redirectUrl: result.redirectUrl,
          amount: result.amount,
          currency: result.currency,
        })

      case PaymentResult.InvalidAmount:
        throw new BadRequestException({
          path: ['amount'],
          message: result.minAmount
            ? `Minimum deposit amount is ${result.minAmount} ${result.currency}`
            : `Maximum deposit amount is ${result.maxAmount} ${result.currency}`,
        })

      case PaymentResult.UnsupportedMethod:
        throw new BadRequestException({
          path: ['method'],
          message: `Payment method ${result.method} is not supported for provider ${result.provider}`,
        })

      case PaymentResult.UnsupportedCurrency:
        throw new BadRequestException({
          path: ['currency'],
          message: `Currency ${result.currency} is not supported for method ${result.method}`,
        })

      case PaymentResult.ProviderError:
        throw new BadRequestException({
          path: ['provider'],
          message: `Payment provider error: ${result.error}`,
        })

      case PaymentResult.Failed:
      default:
        throw new BadRequestException({
          path: ['payment'],
          message: result.error || 'Payment failed',
        })
    }
  },
)
