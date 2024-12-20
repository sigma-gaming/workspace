import { BadRequestException } from '@core/exceptions'
import { limitByIp, zValidator } from '@core/server'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import {
  GlobalTaskClaimRewardOutcome,
  globalTaskService,
  sessionService,
} from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../../app/router'

export const claimRewardRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  zValidator(
    'json',
    z.object({
      taskKey: z.nativeEnum(GlobalTaskKey),
    }),
  ),
  async (ctx) => {
    const { userId } = await sessionService.getHonoSession(ctx)
    const { taskKey } = ctx.req.valid('json')

    const completion = await globalTaskService.claimReward({
      userId,
      taskKey,
    })

    if (completion.outcome === GlobalTaskClaimRewardOutcome.Claimed) {
      const { updatedBalance, payout } = completion
      const { available } = updatedBalance

      // ctx.socket.to(userRoom(userId)).emit('balance/updated', { available })

      // ctx.socket.to(userRoom(userId)).emit('global-tasks/status-updated', {
      //   taskKey,
      //   status: TaskStatus.Claimed,
      // })

      return ctx.json({
        taskKey,
        status: TaskStatus.Claimed,
        updatedBalance: available,
        payout,
      })
    }

    if (completion.outcome === GlobalTaskClaimRewardOutcome.AlreadyClaimed) {
      throw new BadRequestException({ message: 'Награда уже получена' })
    }

    if (completion.outcome === GlobalTaskClaimRewardOutcome.NotCompleted) {
      throw new BadRequestException({ message: 'Задание еще не выполнено' })
    }

    throw new BadRequestException({
      message:
        'Не удалось получить награду.' +
        ' Попробуйте ещё раз или напишите в поддержку',
    })
  },
)
