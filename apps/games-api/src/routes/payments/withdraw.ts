import { BadRequestException } from '@core/exceptions'
import { limitByIp, zValidator } from '@core/server'
import { Currency, PaymentProvider, WithdrawalMethod } from '@dbs/games-types'
import { gemInt } from '@games/model'
import { PaymentOutcome, paymentService, sessionService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../app/router'

const PayloadSchema = z.object({
  gemAmount: z.number().min(gemInt(1)),
  provider: z.nativeEnum(PaymentProvider),
  method: z.nativeEnum(WithdrawalMethod),
  currency: z.nativeEnum(Currency),
})

export const withdrawRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  zValidator('json', PayloadSchema),
  async (ctx) => {
    const { userId } = await sessionService.getHonoSession(ctx)
    const { gemAmount, provider, method, currency } = ctx.req.valid('json')

    const result = await paymentService.createWithdrawal({
      userId,
      gemAmount,
      provider,
      method,
      currency,
      userIp: ctx.env.ip,
    })

    switch (result.outcome) {
      case PaymentOutcome.Success:
        return ctx.json({
          id: result.withdrawal.id,
          method: result.withdrawal.method,
          provider: result.withdrawal.provider,
          currency: result.withdrawal.currency,
          status: result.withdrawal.status,
        })

      case PaymentOutcome.InsufficientFunds:
        throw new BadRequestException({
          path: ['amount'],
          message: `Недостаточно средств`,
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
          message: 'Не удалось произвести вывод',
        })
    }
  },
)
