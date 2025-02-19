import { sessionService, userService } from '@games/services'
import { createRouter } from '../../app/router'

export const getUserRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const user = await userService.getUserSafe(userId)
  return ctx.json(user)
})
