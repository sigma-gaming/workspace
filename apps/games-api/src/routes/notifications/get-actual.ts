import { notificationService } from '@games/services'
import { createRouter } from '../../hono'

export const getActualRoute = createRouter().get('/', async (ctx) => {
  const user = ctx.get('user')
  const actual = await notificationService.getActual(user?.id)
  return ctx.json(actual)
})
