import { createSingletonProxy } from '@core/di'
import { Logger, LoggerService } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import { GlobalTaskSelect, GlobalTaskStatusTable } from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus, TransactionType } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import { and, eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { locks } from './locks'
import { TransactionService } from './transaction'

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

@singleton()
export class GlobalTaskService {
  logger: Logger

  constructor(
    private transactionService: TransactionService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.logger.child('GlobalTask')
  }

  async getTasks() {
    const cached = await gamesCaches.globalTasks.get()
    if (cached) return cached

    const tasks = await gamesDb.query.GlobalTaskTable.findMany()
    await gamesCaches.globalTasks.set(tasks)
    return tasks
  }

  async getTask(key: GlobalTaskKey) {
    const tasks = await this.getTasks()
    return tasks.find((task) => task.key === key) ?? null
  }

  async getStatus(taskKey: GlobalTaskKey, userId: string) {
    const cacheKey = `${userId}:${taskKey}`
    const cached = await gamesCaches.globalTaskStatus.get(cacheKey)
    if (cached) return cached

    const entity = await gamesDb.query.GlobalTaskStatusTable.findFirst({
      where: and(
        eq(GlobalTaskStatusTable.taskKey, taskKey),
        eq(GlobalTaskStatusTable.userId, userId),
      ),
    })

    const status = entity?.status ?? TaskStatus.Pending
    const inserted = Boolean(entity)
    await gamesCaches.globalTaskStatus.set(cacheKey, [status, inserted])
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
    await gamesCaches.globalTaskStatus.set(cacheKey, [status, true])
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

        await controller.add(locks.transaction(userId))

        const lastTransaction =
          await this.transactionService.getLastTransaction(userId)

        const wageringIncrease = Math.ceil(
          task.payout * (task.wageringMultiplier / 100),
        )

        const [transaction] = await this.transactionService.createTransaction({
          payload: this.transactionService.generateTransaction(
            lastTransaction,
            {
              userId,
              type: TransactionType.Bonus,
              amount: task.payout,
              wageringIncrease,
            },
          ),
        })

        await this.updateStatus(taskKey, userId, TaskStatus.Claimed)

        return {
          result: GlobalTaskClaimRewardResult.Claimed,
          updatedBalance: transaction.closingBalance,
          payout: task.payout,
        }
      },
    )
  }
}

export const globalTaskService = createSingletonProxy(GlobalTaskService)
