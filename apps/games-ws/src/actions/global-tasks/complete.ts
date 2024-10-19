import {
  BadRequestException,
  NotAuthenticatedException,
} from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { AccountTable } from '@dbs/games-schema'
import { AccountProvider, GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import {
  GlobalTaskChecker,
  GlobalTaskCompleteResult,
  globalTaskService,
  RepostStatus,
  telegramBotService,
  vkService,
} from '@games/services'
import { and, eq } from 'drizzle-orm'
import { Context } from '../../context'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'
import {
  GlobalTasksCompleteOutput,
  GlobalTasksCompletePayloadSchema,
} from './contracts'

export const GlobalTasksCompleteAction = createWsAction({
  name: 'global-tasks/complete',
  schema: GlobalTasksCompletePayloadSchema,
  handler: async (
    ctx: Context,
    payload,
  ): Promise<GlobalTasksCompleteOutput> => {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    const checkers: Record<GlobalTaskKey, GlobalTaskChecker> = {
      [GlobalTaskKey.TelegramGroupSubscribe]: async ({ requirements }) => {
        if (requirements.type !== GlobalTaskKey.TelegramGroupSubscribe)
          return {
            completed: false,
            message:
              'Не удалось проверить задание.' +
              ' Попробуйте ещё раз или напишите в поддержку',
          }

        const account = await gamesDb.query.AccountTable.findFirst({
          where: and(
            eq(AccountTable.provider, AccountProvider.Telegram),
            eq(AccountTable.userId, session.userId),
          ),
        })

        if (!account)
          return {
            completed: false,
            message: 'Для начала нужно привязать аккаунт Telegram',
          }

        const { providerUserId } = account

        const subscribed = await telegramBotService.checkSubscription(
          Number(providerUserId),
          requirements.groupId,
        )

        return { completed: subscribed }
      },
      [GlobalTaskKey.VkGroupSubscribe]: async ({ requirements }) => {
        if (requirements.type !== GlobalTaskKey.VkGroupSubscribe)
          return {
            completed: false,
            message:
              'Не удалось проверить задание.' +
              ' Попробуйте ещё раз или напишите в поддержку',
          }

        const account = await gamesDb.query.AccountTable.findFirst({
          where: and(
            eq(AccountTable.provider, AccountProvider.VK),
            eq(AccountTable.userId, session.userId),
          ),
        })

        if (!account)
          return {
            completed: false,
            message: 'Для начала нужно привязать аккаунт VK',
          }

        const { providerUserId } = account

        const subscribed = await vkService.checkSubscription(
          Number(providerUserId),
          requirements.groupId,
        )

        return { completed: subscribed }
      },
      [GlobalTaskKey.VkPinnedRepost]: async ({ requirements }) => {
        if (requirements.type !== GlobalTaskKey.VkPinnedRepost)
          return {
            completed: false,
            message:
              'Не удалось проверить задание.' +
              ' Попробуйте ещё раз или напишите в поддержку',
          }

        const account = await gamesDb.query.AccountTable.findFirst({
          where: and(
            eq(AccountTable.provider, AccountProvider.VK),
            eq(AccountTable.userId, session.userId),
          ),
        })

        if (!account)
          return {
            completed: false,
            message: 'Для начала нужно привязать аккаунт VK',
          }

        const { providerUserId } = account

        const repostStatus = await vkService.getRepostStatus(
          Number(providerUserId),
          requirements.groupId,
          requirements.postId,
        )

        if (repostStatus === RepostStatus.Reposted) {
          return { completed: true }
        }

        if (repostStatus === RepostStatus.NotFound) {
          return { completed: false }
        }

        if (repostStatus === RepostStatus.WallNotAvailable) {
          return {
            completed: false,
            message: 'Ваш профиль VK и/или стена закрыты',
          }
        }

        if (repostStatus === RepostStatus.TooManyRequests) {
          return {
            completed: false,
            message: 'Сейчас мы не можем проверить задание, попробуйте позже',
          }
        }

        if (repostStatus === RepostStatus.ProfileDeleted) {
          return {
            completed: false,
            message: 'Ваша страница VK удалена или заморожена',
          }
        }

        return {
          completed: false,
          message:
            'Не удалось проверить задание.' +
            ' Попробуйте ещё раз или напишите в поддержку',
        }
      },
    }

    const completion = await globalTaskService.completeTask({
      userId: session.userId,
      taskKey: payload.taskKey,
      checker: checkers[payload.taskKey],
    })

    if (completion.result === GlobalTaskCompleteResult.Completed) {
      ctx.socket
        .to(userRoom(session.userId))
        .emit('global-tasks/status-updated', {
          taskKey: payload.taskKey,
          status: TaskStatus.Completed,
        })

      return
    }

    if (completion.result === GlobalTaskCompleteResult.AlreadyCompleted) {
      throw new BadRequestException({ message: 'Задание уже выполнено' })
    }

    if (completion.result === GlobalTaskCompleteResult.NotCompleted) {
      throw new BadRequestException({
        message: completion.message ?? 'Задание еще не выполнено',
      })
    }

    throw new BadRequestException({
      message:
        'Не удалось проверить задание. Попробуйте ещё раз или напишите в поддержку',
    })
  },
})
