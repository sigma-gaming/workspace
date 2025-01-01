import { BadRequestException } from '@core/exceptions'
import { tbValidator } from '@core/server'
import { AccountTable } from '@dbs/games-schema'
import { AccountProvider, GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { GlobalTaskUpdate, UpdateMode } from '@games/model'
import {
  gamesDb,
  gamesPubsubs,
  GlobalTaskChecker,
  GlobalTaskCompleteOutcome,
  globalTaskService,
  RepostStatus,
  sessionService,
  telegramBotService,
  vkService,
} from '@games/services'
import { Type } from '@sinclair/typebox'
import { and, eq } from 'drizzle-orm'
import { createRouter } from '../../../app/router'
import { limitByIp } from '../../../middlewares/rate-limit'

const checkers: Record<GlobalTaskKey, GlobalTaskChecker> = {
  [GlobalTaskKey.TelegramGroupSubscribe]: async (userId, { requirements }) => {
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
        eq(AccountTable.userId, userId),
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
  [GlobalTaskKey.VkGroupSubscribe]: async (userId, { requirements }) => {
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
        eq(AccountTable.userId, userId),
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
  [GlobalTaskKey.VkPinnedRepost]: async (userId, { requirements }) => {
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
        eq(AccountTable.userId, userId),
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

const PayloadSchema = Type.Object({
  taskKey: Type.Enum(GlobalTaskKey),
})

export const completeRoute = createRouter().post(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  tbValidator('json', PayloadSchema),
  async (ctx) => {
    const { userId } = await sessionService.getHonoSession(ctx)
    const { taskKey } = ctx.req.valid('json')

    const completion = await globalTaskService.completeTask({
      userId,
      taskKey,
      checker: checkers[taskKey],
    })

    if (completion.outcome === GlobalTaskCompleteOutcome.Completed) {
      const task: GlobalTaskUpdate = {
        time: Date.now(),
        mode: UpdateMode.Optimized,
        key: taskKey,
        status: TaskStatus.Completed,
      }

      gamesPubsubs.globalTaskUpdated.publish({
        userId,
        update: task,
      })

      return ctx.json({
        task,
      })
    }

    if (completion.outcome === GlobalTaskCompleteOutcome.AlreadyCompleted) {
      throw new BadRequestException({ message: 'Задание уже выполнено' })
    }

    if (completion.outcome === GlobalTaskCompleteOutcome.NotCompleted) {
      throw new BadRequestException({
        message: completion.message ?? 'Задание еще не выполнено',
      })
    }

    throw new BadRequestException({
      message:
        'Не удалось проверить задание. Попробуйте ещё раз или напишите в поддержку',
    })
  },
)
