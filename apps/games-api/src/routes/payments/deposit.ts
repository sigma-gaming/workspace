import { BadRequestException, InternalServerException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { Currency, DepositMethod, PaymentProvider } from '@dbs/games-types'
import { gemInt } from '@games/model'
import { PaymentOutcome, paymentService, sessionService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../hono'

const PayloadSchema = z.object({
  gemAmount: z.number().min(gemInt(1)),
  provider: z.nativeEnum(PaymentProvider),
  method: z.nativeEnum(DepositMethod),
  currency: z.nativeEnum(Currency),
})

export const depositRoute = createRouter().post(
  '/',
  zValidator('json', PayloadSchema),
  async (ctx) => {
    const { userId } = await sessionService.getHonoSession(ctx)
    const { gemAmount, provider, method, currency } = ctx.req.valid('json')
    const host = ctx.req.header('x-forwarded-host') ?? ctx.req.header('host')

    if (!host) {
      throw new InternalServerException()
    }

    const redirectUrl = `https://${host}`

    const result = await paymentService.createDeposit({
      userId,
      gemAmount,
      provider,
      method,
      currency,
      redirectUrl,
      userIp: ctx.env.ip,
    })

    switch (result.outcome) {
      case PaymentOutcome.Success:
        return ctx.json({
          id: result.deposit.id,
          method: result.deposit.method,
          provider: result.deposit.provider,
          currency: result.deposit.currency,
          payload: result.deposit.payload,
        })

      case PaymentOutcome.InvalidAmount:
        throw new BadRequestException({
          path: ['amount'],
          message: 'Недопустимая сумма',
        })

      case PaymentOutcome.UnsupportedMethod:
        throw new BadRequestException({
          path: ['method'],
          message: `Этот метод оплаты не поддерживается`,
        })

      case PaymentOutcome.UnsupportedCurrency:
        throw new BadRequestException({
          path: ['currency'],
          message: `Метод оплаты не поддерживает данную валюту`,
        })

      case PaymentOutcome.ProviderError:
        throw new BadRequestException({
          message: `Произошла ошибка на стороне провайдера`,
        })

      case PaymentOutcome.Failed:
      default:
        throw new BadRequestException({
          path: ['payment'],
          message: result.error || 'Не удалось произвести пополнение',
        })
    }
  },
)
