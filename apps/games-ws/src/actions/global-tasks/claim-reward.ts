import {
  BadRequestException,
  NotAuthenticatedException,
} from '@core/exceptions'
import { TaskStatus } from '@dbs/games-types'
import {
  GlobalTaskClaimRewardOutcome,
  globalTaskService,
} from '@games/services'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'
import {
  GlobalTasksClaimRewardOutput,
  GlobalTasksClaimRewardPayloadSchema,
} from './contracts'

export const GlobalTasksClaimRewardAction = createWsAction({
  name: 'global-tasks/claim-reward',
  schema: GlobalTasksClaimRewardPayloadSchema,
  handler: async (ctx, payload): Promise<GlobalTasksClaimRewardOutput> => {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    const completion = await globalTaskService.claimReward({
      userId: session.userId,
      taskKey: payload.taskKey,
    })

    if (completion.outcome === GlobalTaskClaimRewardOutcome.Claimed) {
      const { updatedBalance, payout } = completion
      const { available } = updatedBalance

      ctx.socket
        .to(userRoom(session.userId))
        .emit('balance/updated', { available })

      ctx.socket
        .to(userRoom(session.userId))
        .emit('global-tasks/status-updated', {
          taskKey: payload.taskKey,
          status: TaskStatus.Claimed,
        })

      return { updatedBalance: available, payout }
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
})
