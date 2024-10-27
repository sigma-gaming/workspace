import { userService } from '@games/services'
import { createRouter } from '../../hono'

export const getUserRoute = createRouter().get('/', async (ctx) => {
  const { userId } = ctx.get('session')
  const user = await userService.getUser(userId)
  return ctx.json(user)
})
