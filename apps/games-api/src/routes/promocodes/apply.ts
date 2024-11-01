import { BadRequestException, InternalServerException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { PromocodeBonusType } from '@dbs/games-types'
import {
  PromocodeActivationResult,
  promocodeService,
  sessionService,
} from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../hono'

type FailureActivationResult = Exclude<
  PromocodeActivationResult,
  | PromocodeActivationResult.AppliedPayout
  | PromocodeActivationResult.AppliedDeposit
>

const MessageMap: Record<FailureActivationResult, string> = {
  [PromocodeActivationResult.NotFound]: 'Промокод не найден',
  [PromocodeActivationResult.Expired]: 'Срок действия промокода истёк',
  [PromocodeActivationResult.WrongUsage]: '{{instruction}}',
  [PromocodeActivationResult.UsageExceeded]:
    'Достигнут лимит использования промокода',
  [PromocodeActivationResult.AlreadyUsed]: 'Вы уже использовали этот промокод',
  [PromocodeActivationResult.Inactive]: 'Промокод не активен',
  [PromocodeActivationResult.Failed]:
    'Не удалось применить промокод. Попробуйте ещё раз или напишите в поддержку',
  [PromocodeActivationResult.Blocked]:
    'Не удалось применить промокод. Попробуйте ещё раз или напишите в поддержку',
}

export const applyRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      code: z.string().min(1, 'Не может быть пустым'),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const { userId } = await sessionService.getHonoSession(ctx)

    const application = await promocodeService.applyPayout({
      userId,
      code: payload.code,
    })

    if (application.result === PromocodeActivationResult.AppliedPayout) {
      return ctx.json({
        status: 'success',
        bonusType: PromocodeBonusType.Payout,
        payout: application.payout,
        updatedBalance: application.updatedBalance.available,
      })
    }

    if (application.result === PromocodeActivationResult.AppliedDeposit) {
      const cause = new Error('Unreachable')
      throw new InternalServerException({ cause })
    }

    if (application.result === PromocodeActivationResult.WrongUsage) {
      const map: Record<PromocodeBonusType, string> = {
        [PromocodeBonusType.DepositFixed]:
          'Данный промокод нужно использовать при пополнении',
        [PromocodeBonusType.DepositMultiplier]:
          'Данный промокод нужно использовать при пополнении',
        [PromocodeBonusType.Payout]:
          'Данный промокод нужно использовать на странице бонусов',
      }

      throw new BadRequestException({
        message: MessageMap[application.result].replace(
          '{{instruction}}',
          map[application.bonusType],
        ),
      })
    }

    throw new BadRequestException({
      message: MessageMap[application.result],
    })
  },
)
