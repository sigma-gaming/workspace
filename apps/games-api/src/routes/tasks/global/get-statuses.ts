import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { globalTaskService, sessionService } from '@games/services'
import { createRouter } from '../../../hono'

type Statuses = Record<GlobalTaskKey, TaskStatus>

export const getStatusesRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const promises: Promise<{ key: GlobalTaskKey; status: TaskStatus }>[] = []

  for (const key of Object.values(GlobalTaskKey)) {
    promises.push(
      globalTaskService
        .getStatus(key, userId)
        .then(([status]) => ({ key, status })),
    )
  }

  const results = await Promise.all(promises)

  const statuses = results.reduce((acc, { key, status }) => {
    acc[key] = status
    return acc
  }, {} as Statuses)

  return ctx.json(statuses)
})
