import { BadRequestException } from '@core/exceptions'
import { tbValidator } from '@core/server'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { BalanceUpdate, GlobalTaskUpdate, UpdateMode } from '@games/model'
import {
  gamesPubsubs,
  GlobalTaskClaimRewardOutcome,
  globalTaskService,
  sessionService,
} from '@games/services'
import { Type } from '@sinclair/typebox'
import { createRouter } from '../../../app/router'
import { limitByIp } from '../../../middlewares/rate-limit'

const PayloadSchema = Type.Object({
  taskKey: Type.Enum(GlobalTaskKey),
})

export const claimRewardRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  tbValidator('json', PayloadSchema),
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

      const time = Date.now()

      const task: GlobalTaskUpdate = {
        time,
        mode: UpdateMode.Optimized,
        key: taskKey,
        status: TaskStatus.Claimed,
      }

      const balance: BalanceUpdate = {
        time,
        mode: UpdateMode.Optimized,
        available,
      }

      gamesPubsubs.balanceUpdated.publish({
        userId,
        update: balance,
      })

      gamesPubsubs.globalTaskUpdated.publish({
        userId,
        update: task,
      })

      return ctx.json({
        payout,
        task,
        balance,
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
