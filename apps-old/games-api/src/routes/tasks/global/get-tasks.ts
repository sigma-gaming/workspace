import { globalTaskService } from '@games/services'
import { createRouter } from '../../../app/router'

export const getTasksRoute = createRouter().get('/', async (ctx) => {
  const tasks = await globalTaskService.getTasks()
  return ctx.json(tasks)
})
