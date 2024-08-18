import { sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getUserRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  return ctx.json(user)
})
