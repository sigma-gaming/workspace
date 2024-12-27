import { BadRequestException, InternalServerException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { PromocodeBonusType } from '@dbs/games-types'
import { BalanceUpdate, UpdateMode } from '@games/model'
import {
  gamesPubsubs,
  PromocodeActivationOutcome,
  promocodeService,
  sessionService,
} from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../app/router'
import { limitByIp } from '../../middlewares/rate-limit'

type FailureActivationResult = Exclude<
  PromocodeActivationOutcome,
  | PromocodeActivationOutcome.AppliedPayout
  | PromocodeActivationOutcome.AppliedDeposit
>

const MessageMap: Record<FailureActivationResult, string> = {
  [PromocodeActivationOutcome.NotFound]: 'Промокод не найден',
  [PromocodeActivationOutcome.Expired]: 'Срок действия промокода истёк',
  [PromocodeActivationOutcome.WrongUsage]: '{{instruction}}',
  [PromocodeActivationOutcome.UsageExceeded]:
    'Достигнут лимит использования промокода',
  [PromocodeActivationOutcome.AlreadyUsed]: 'Вы уже использовали этот промокод',
  [PromocodeActivationOutcome.Inactive]: 'Промокод не активен',
  [PromocodeActivationOutcome.Failed]:
    'Не удалось применить промокод. Попробуйте ещё раз или напишите в поддержку',
  [PromocodeActivationOutcome.Blocked]:
    'Не удалось применить промокод. Попробуйте ещё раз или напишите в поддержку',
}

export const applyRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  zValidator(
    'json',
    z.object({
      code: z.string().min(1, 'Не может быть пустым'),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const { userId } = await sessionService.getHonoSession(ctx)

    const result = await promocodeService.applyPayout({
      userId,
      code: payload.code,
    })

    if (result.outcome === PromocodeActivationOutcome.AppliedPayout) {
      const balance: BalanceUpdate = {
        time: Date.now(),
        mode: UpdateMode.Optimized,
        available: result.updatedBalance.available,
      }

      gamesPubsubs.balanceUpdated.publish({
        userId,
        update: balance,
      })

      return ctx.json({
        bonusType: PromocodeBonusType.Payout,
        payout: result.payout,
        balance,
      })
    }

    if (result.outcome === PromocodeActivationOutcome.AppliedDeposit) {
      const cause = new Error('Unreachable')
      throw new InternalServerException({ cause })
    }

    if (result.outcome === PromocodeActivationOutcome.WrongUsage) {
      const map: Record<PromocodeBonusType, string> = {
        [PromocodeBonusType.DepositFixed]:
          'Данный промокод нужно использовать при пополнении',
        [PromocodeBonusType.DepositMultiplier]:
          'Данный промокод нужно использовать при пополнении',
        [PromocodeBonusType.Payout]:
          'Данный промокод нужно использовать на странице бонусов',
      }

      throw new BadRequestException({
        message: MessageMap[result.outcome].replace(
          '{{instruction}}',
          map[result.bonusType],
        ),
      })
    }

    throw new BadRequestException({
      message: MessageMap[result.outcome],
    })
  },
)
