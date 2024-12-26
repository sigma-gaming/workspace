import { Logger, loggerService } from '@core/logger'
import { takeFirstOrThrow } from '@core/utils'
import {
  BalanceSelect,
  BalanceTable,
  GlobalTaskSelect,
  GlobalTaskStatusTable,
} from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus, TransactionType } from '@dbs/games-types'
import { gamesDb } from '@games/services'
import { and, eq } from 'drizzle-orm'
import { balanceService } from './balance'
import { gamesCache } from './cache'

export enum GlobalTaskCompleteOutcome {
  AlreadyCompleted = 'AlreadyCompleted',
  NotCompleted = 'NotCompleted',
  Completed = 'Completed',
  NotActive = 'NotActive',
  Failed = 'Failed',
}

type GlobalTaskCompleteOutput =
  | {
      outcome: GlobalTaskCompleteOutcome.NotCompleted
      message?: string
    }
  | { outcome: GlobalTaskCompleteOutcome.Completed; updatedStatus: TaskStatus }
  | {
      outcome:
        | GlobalTaskCompleteOutcome.AlreadyCompleted
        | GlobalTaskCompleteOutcome.NotActive
        | GlobalTaskCompleteOutcome.Failed
    }

export enum GlobalTaskClaimRewardOutcome {
  AlreadyClaimed = 'AlreadyClaimed',
  NotCompleted = 'NotCompleted',
  Claimed = 'Claimed',
  Failed = 'Failed',
}

type GlobalTaskClaimRewardOutput =
  | {
      outcome: GlobalTaskClaimRewardOutcome.Claimed
      updatedBalance: BalanceSelect
      payout: number
      updatedStatus: TaskStatus
    }
  | {
      outcome: Exclude<
        GlobalTaskClaimRewardOutcome,
        GlobalTaskClaimRewardOutcome.Claimed
      >
    }

export type GlobalTaskChecker = (
  userId: string,
  task: GlobalTaskSelect,
) => Promise<
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
    const query = () => gamesDb.query.GlobalTaskTable.findMany()

    if (!gamesCache.ready) {
      return query()
    }

    const cached = await gamesCache.globalTasks.get()
    if (cached) return cached

    const tasks = await query()
    await gamesCache.globalTasks.set(tasks)
    return tasks
  }

  async getTask(key: GlobalTaskKey) {
    const tasks = await this.getTasks()
    return tasks.find((task) => task.key === key) ?? null
  }

  private async queryStatus(options: {
    taskKey: GlobalTaskKey
    userId: string
  }) {
    const { taskKey, userId } = options

    const entity = await gamesDb.query.GlobalTaskStatusTable.findFirst({
      where: and(
        eq(GlobalTaskStatusTable.taskKey, taskKey),
        eq(GlobalTaskStatusTable.userId, userId),
      ),
    })

    const status = entity?.status ?? TaskStatus.Pending
    const inserted = Boolean(entity)
    return [status, inserted] as const
  }

  async getStatus(options: { taskKey: GlobalTaskKey; userId: string }) {
    const { taskKey, userId } = options

    if (!gamesCache.ready) {
      return this.queryStatus({ taskKey, userId })
    }

    const cacheKey = `${userId}:${taskKey}`
    const cached = await gamesCache.globalTaskStatus.get(cacheKey)
    if (cached) return cached

    const [status, inserted] = await this.queryStatus({ taskKey, userId })
    await gamesCache.globalTaskStatus.set(cacheKey, [status, inserted])
    return [status, inserted] as const
  }

  async updateStatus(payload: {
    tx?: typeof gamesDb
    userId: string
    taskKey: GlobalTaskKey
    status: TaskStatus
  }) {
    const { taskKey, userId, status } = payload
    const db = payload.tx ?? gamesDb

    const [, inserted] = await this.getStatus({ taskKey, userId })

    if (inserted) {
      await db
        .update(GlobalTaskStatusTable)
        .set({ status })
        .where(
          and(
            eq(GlobalTaskStatusTable.taskKey, taskKey),
            eq(GlobalTaskStatusTable.userId, userId),
          ),
        )
    } else {
      await db.insert(GlobalTaskStatusTable).values({
        taskKey,
        userId,
        status,
      })
    }
  }

  async completeTask(payload: {
    userId: string
    taskKey: GlobalTaskKey
    checker: GlobalTaskChecker
  }): Promise<GlobalTaskCompleteOutput> {
    const { userId, taskKey, checker } = payload

    const completion = await gamesDb.transaction(
      async (tx): Promise<GlobalTaskCompleteOutput> => {
        try {
          const [statusEntity] = await tx
            .select()
            .from(GlobalTaskStatusTable)
            .where(
              and(
                eq(GlobalTaskStatusTable.taskKey, taskKey),
                eq(GlobalTaskStatusTable.userId, userId),
              ),
            )
            .for('update')

          const status = statusEntity?.status ?? TaskStatus.Pending

          if (status !== TaskStatus.Pending) {
            return { outcome: GlobalTaskCompleteOutcome.AlreadyCompleted }
          }

          const task = await this.getTask(taskKey)

          if (!task) {
            return { outcome: GlobalTaskCompleteOutcome.Failed }
          }

          if (!task.isActive) {
            return { outcome: GlobalTaskCompleteOutcome.NotActive }
          }

          const check = await checker(userId, task)

          if (!check.completed)
            return {
              outcome: GlobalTaskCompleteOutcome.NotCompleted,
              message: check.message,
            }

          await this.updateStatus({
            tx,
            taskKey,
            userId,
            status: TaskStatus.Completed,
          })

          const cacheKey = `${userId}:${taskKey}`

          await gamesCache.globalTaskStatus.set(cacheKey, [
            TaskStatus.Completed,
            true,
          ])

          return {
            outcome: GlobalTaskCompleteOutcome.Completed,
            updatedStatus: TaskStatus.Completed,
          }
        } catch (error) {
          this.logger.error(error)
          return { outcome: GlobalTaskCompleteOutcome.Failed }
        }
      },
    )

    if (
      completion.outcome === GlobalTaskCompleteOutcome.Completed &&
      gamesCache.ready
    ) {
      const cacheKey = `${userId}:${taskKey}`

      await gamesCache.globalTaskStatus.set(cacheKey, [
        completion.updatedStatus,
        true,
      ])
    }

    return completion
  }

  async claimReward(payload: {
    userId: string
    taskKey: GlobalTaskKey
  }): Promise<GlobalTaskClaimRewardOutput> {
    const { userId, taskKey } = payload

    const claim = await gamesDb.transaction(
      async (tx): Promise<GlobalTaskClaimRewardOutput> => {
        const [statusEntity] = await tx
          .select()
          .from(GlobalTaskStatusTable)
          .where(
            and(
              eq(GlobalTaskStatusTable.taskKey, taskKey),
              eq(GlobalTaskStatusTable.userId, userId),
            ),
          )
          .for('update')

        const status = statusEntity?.status ?? TaskStatus.Pending

        if (status === TaskStatus.Claimed) {
          return { outcome: GlobalTaskClaimRewardOutcome.AlreadyClaimed }
        }

        if (status !== TaskStatus.Completed) {
          return { outcome: GlobalTaskClaimRewardOutcome.NotCompleted }
        }

        const task = await this.getTask(taskKey)

        if (!task) {
          return { outcome: GlobalTaskClaimRewardOutcome.Failed }
        }

        const balance = await tx
          .select()
          .from(BalanceTable)
          .where(eq(BalanceTable.userId, userId))
          .for('update')
          .then(takeFirstOrThrow)

        const wageringChange = Math.ceil(
          task.payout * (task.wageringMultiplier / 100),
        )

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

        await this.updateStatus({
          tx,
          taskKey,
          userId,
          status: TaskStatus.Claimed,
        })

        const cacheKey = `${userId}:${taskKey}`

        await gamesCache.globalTaskStatus.set(cacheKey, [
          TaskStatus.Claimed,
          true,
        ])

        return {
          outcome: GlobalTaskClaimRewardOutcome.Claimed,
          updatedBalance,
          payout: task.payout,
          updatedStatus: TaskStatus.Claimed,
        }
      },
    )

    if (
      claim.outcome === GlobalTaskClaimRewardOutcome.Claimed &&
      gamesCache.ready
    ) {
      const cacheKey = `${userId}:${taskKey}`

      await gamesCache.balance.set(userId, claim.updatedBalance)

      await gamesCache.globalTaskStatus.set(cacheKey, [
        claim.updatedStatus,
        true,
      ])
    }

    return claim
  }
}

export const globalTaskService = new GlobalTaskService()
