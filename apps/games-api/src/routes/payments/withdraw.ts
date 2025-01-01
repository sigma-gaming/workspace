import { BadRequestException } from '@core/exceptions'
import { tbValidator, TypeboxError } from '@core/server'
import { Currency, PaymentProvider, WithdrawalMethod } from '@dbs/games-types'
import { gemInt } from '@games/model'
import { PaymentOutcome, paymentService, sessionService } from '@games/services'
import { Type } from '@sinclair/typebox'
import { createRouter } from '../../app/router'
import { limitByIp } from '../../middlewares/rate-limit'

const PayloadSchema = Type.Object({
  gemAmount: Type.Integer({
    minimum: gemInt(1),
  }),
  provider: Type.Enum(PaymentProvider),
  method: Type.Enum(WithdrawalMethod),
  currency: Type.Enum(Currency),
})

export const withdrawRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  tbValidator('json', PayloadSchema, {
    gemAmount: {
      [TypeboxError.IntegerMinimum]: 'Минимальная сумма вывода - 1 гем',
    },
    provider: {
      [TypeboxError.Union]: 'Неподдерживаемый провайдер',
    },
    method: {
      [TypeboxError.Union]: 'Неподдерживаемый метод вывода',
    },
    currency: {
      [TypeboxError.Union]: 'Неподдерживаемая валюта',
    },
  }),
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
