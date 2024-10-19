import {
  BadRequestException,
  NotAuthenticatedException,
} from '@core/exceptions'
import { TaskStatus } from '@dbs/games-types'
import { GlobalTaskClaimRewardResult, globalTaskService } from '@games/services'
import { Context } from '../../context'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'
import {
  GlobalTasksClaimRewardOutput,
  GlobalTasksClaimRewardPayloadSchema,
} from './contracts'

export const GlobalTasksClaimRewardAction = createWsAction({
  name: 'global-tasks/claim-reward',
  schema: GlobalTasksClaimRewardPayloadSchema,
  handler: async (
    ctx: Context,
    payload,
  ): Promise<GlobalTasksClaimRewardOutput> => {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    const completion = await globalTaskService.claimReward({
      userId: session.userId,
      taskKey: payload.taskKey,
    })

    if (completion.result === GlobalTaskClaimRewardResult.Claimed) {
      const { updatedBalance, payout } = completion

      ctx.socket
        .to(userRoom(session.userId))
        .emit('balance/updated', { available: updatedBalance })

      ctx.socket
        .to(userRoom(session.userId))
        .emit('global-tasks/status-updated', {
          taskKey: payload.taskKey,
          status: TaskStatus.Claimed,
        })

      return { updatedBalance, payout }
    }

    if (completion.result === GlobalTaskClaimRewardResult.AlreadyClaimed) {
      throw new BadRequestException({ message: 'Награда уже получена' })
    }

    if (completion.result === GlobalTaskClaimRewardResult.NotCompleted) {
      throw new BadRequestException({ message: 'Задание еще не выполнено' })
    }

    throw new BadRequestException({
      message:
        'Не удалось получить награду.' +
        ' Попробуйте ещё раз или напишите в поддержку',
    })
  },
})
