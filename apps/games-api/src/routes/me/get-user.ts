import { sessionService, userService } from '@games/services'
import { createRouter } from '../../hono'

export const getUserRoute = createRouter().get('/', async (ctx) => {
  const { userId } = sessionService.getHonoSession(ctx)
  const user = await userService.getUserSafe(userId)
  return ctx.json(user)
})
