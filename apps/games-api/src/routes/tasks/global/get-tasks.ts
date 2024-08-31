import { globalTaskService, sessionService } from '@games/services'
import { createRouter } from '../../../hono'

export const getTasksRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  sessionService.getUser(session)

  const tasks = await globalTaskService.getTasks()
  return ctx.json(tasks)
})
