import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { globalTaskService, sessionService } from '@games/services'
import { createRouter } from '../../../hono'

type Statuses = Record<GlobalTaskKey, TaskStatus>

export const getStatusesRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const promises: Promise<{ key: GlobalTaskKey; status: TaskStatus }>[] = []

  for (const key of Object.values(GlobalTaskKey)) {
    promises.push(
      globalTaskService
        .getStatus(key, user.id)
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
