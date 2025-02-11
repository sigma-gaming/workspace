import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { globalTaskService, sessionService } from '@games/services'
import { createRouter } from '../../../app/router'

type Statuses = Record<GlobalTaskKey, TaskStatus>

export const getStatusesRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const promises: Promise<{ taskKey: GlobalTaskKey; status: TaskStatus }>[] = []

  for (const taskKey of Object.values(GlobalTaskKey)) {
    promises.push(
      globalTaskService
        .getStatus({ taskKey: Number(taskKey), userId })
        .then(([status]) => ({ taskKey: Number(taskKey), status })),
    )
  }

  const results = await Promise.all(promises)

  const statuses = results.reduce((acc, { taskKey, status }) => {
    acc[taskKey] = status
    return acc
  }, {} as Statuses)

  return ctx.json(statuses)
})
