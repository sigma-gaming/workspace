import { Logger, loggerService } from '@core/logger'
import { GlobalTaskSelect, GlobalTaskStatusTable } from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus, TransactionType } from '@dbs/games-types'
import { gamesDb } from '@games/services'
import { and, eq } from 'drizzle-orm'
import { balanceService } from './balance'
import { gamesCache } from './cache'
import { locks } from './locks'

export enum GlobalTaskCompleteResult {
  AlreadyCompleted = 'AlreadyCompleted',
  NotCompleted = 'NotCompleted',
  Completed = 'Completed',
  NotActive = 'NotActive',
  Failed = 'Failed',
}

type GlobalTaskCompleteOutput =
  | {
      result: GlobalTaskCompleteResult.NotCompleted
      message?: string
    }
  | {
      result: Exclude<
        GlobalTaskCompleteResult,
        GlobalTaskCompleteResult.NotCompleted
      >
    }

export enum GlobalTaskClaimRewardResult {
  AlreadyClaimed = 'AlreadyClaimed',
  NotCompleted = 'NotCompleted',
  Claimed = 'Claimed',
  Failed = 'Failed',
}

type GlobalTaskClaimRewardOutput =
  | {
      result: GlobalTaskClaimRewardResult.Claimed
      updatedBalance: number
      payout: number
    }
  | {
      result: Exclude<
        GlobalTaskClaimRewardResult,
        GlobalTaskClaimRewardResult.Claimed
      >
    }

export type GlobalTaskChecker = (task: GlobalTaskSelect) => Promise<
  | {
      completed: true
    }
  | {
      completed: false
      message?: string
    }
>

export class GlobalTaskService {
  logger: Logger

  constructor() {
    this.logger = loggerService.logger.child('GlobalTask')
  }

  async getTasks() {
    const cached = await gamesCache.globalTasks.get()
    if (cached) return cached

    const tasks = await gamesDb.query.GlobalTaskTable.findMany()
    await gamesCache.globalTasks.set(tasks)
    return tasks
  }

  async getTask(key: GlobalTaskKey) {
    const tasks = await this.getTasks()
    return tasks.find((task) => task.key === key) ?? null
  }

  async getStatus(taskKey: GlobalTaskKey, userId: string) {
    const cacheKey = `${userId}:${taskKey}`
    const cached = await gamesCache.globalTaskStatus.get(cacheKey)
    if (cached) return cached

    const entity = await gamesDb.query.GlobalTaskStatusTable.findFirst({
      where: and(
        eq(GlobalTaskStatusTable.taskKey, taskKey),
        eq(GlobalTaskStatusTable.userId, userId),
      ),
    })

    const status = entity?.status ?? TaskStatus.Pending
    const inserted = Boolean(entity)
    await gamesCache.globalTaskStatus.set(cacheKey, [status, inserted])
    return [status, inserted] as const
  }

  async updateStatus(
    taskKey: GlobalTaskKey,
    userId: string,
    status: TaskStatus,
  ) {
    const [, inserted] = await this.getStatus(taskKey, userId)

    if (inserted) {
      await gamesDb
        .update(GlobalTaskStatusTable)
        .set({ status })
        .where(
          and(
            eq(GlobalTaskStatusTable.taskKey, taskKey),
            eq(GlobalTaskStatusTable.userId, userId),
          ),
        )
    } else {
      await gamesDb.insert(GlobalTaskStatusTable).values({
        taskKey,
        userId,
        status,
      })
    }

    const cacheKey = `${userId}:${taskKey}`
    await gamesCache.globalTaskStatus.set(cacheKey, [status, true])
  }

  async completeTask(payload: {
    userId: string
    taskKey: GlobalTaskKey
    checker: GlobalTaskChecker
  }): Promise<GlobalTaskCompleteOutput> {
    const { userId, taskKey, checker } = payload

    return locks.with(
      [locks.globalTaskStatus(taskKey, userId)],
      async (): Promise<GlobalTaskCompleteOutput> => {
        try {
          const [status] = await this.getStatus(taskKey, userId)

          if (status !== TaskStatus.Pending) {
            return { result: GlobalTaskCompleteResult.AlreadyCompleted }
          }

          const task = await this.getTask(taskKey)

          if (!task) {
            return { result: GlobalTaskCompleteResult.Failed }
          }

          if (!task.isActive) {
            return { result: GlobalTaskCompleteResult.NotActive }
          }

          const check = await checker(task)

          if (!check.completed)
            return {
              result: GlobalTaskCompleteResult.NotCompleted,
              message: check.message,
            }

          await this.updateStatus(taskKey, userId, TaskStatus.Completed)
          return { result: GlobalTaskCompleteResult.Completed }
        } catch (error) {
          this.logger.error(error)
          return { result: GlobalTaskCompleteResult.Failed }
        }
      },
    )
  }

  async claimReward(payload: {
    userId: string
    taskKey: GlobalTaskKey
  }): Promise<GlobalTaskClaimRewardOutput> {
    const { userId, taskKey } = payload

    return locks.with(
      [locks.globalTaskStatus(taskKey, userId)],
      async (controller): Promise<GlobalTaskClaimRewardOutput> => {
        const [status] = await this.getStatus(taskKey, userId)

        if (status === TaskStatus.Claimed) {
          return { result: GlobalTaskClaimRewardResult.AlreadyClaimed }
        }

        if (status !== TaskStatus.Completed) {
          return { result: GlobalTaskClaimRewardResult.NotCompleted }
        }

        const task = await this.getTask(taskKey)

        if (!task) {
          return { result: GlobalTaskClaimRewardResult.Failed }
        }

        await controller.add(locks.balance(userId))

        const balance = await balanceService.getBalance(userId)

        const wageringChange = Math.ceil(
          task.payout * (task.wageringMultiplier / 100),
        )

        const updatedBalance = await gamesDb.transaction(async (tx) => {
          const transaction = await balanceService.createTransaction({
            tx,
            payload: {
              userId,
              type: TransactionType.Bonus,
              amount: task.payout,
            },
          })

          const updatedBalance = await balanceService.updateBalance({
            tx,
            balance,
            transaction,
            wageringChange,
          })

          return updatedBalance
        })

        await this.updateStatus(taskKey, userId, TaskStatus.Claimed)

        return {
          result: GlobalTaskClaimRewardResult.Claimed,
          updatedBalance: updatedBalance.available,
          payout: task.payout,
        }
      },
    )
  }
}

export const globalTaskService = new GlobalTaskService()
