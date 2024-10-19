import { sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const logoutRoute = createRouter().post('/', async (ctx) => {
  const session = sessionService.getHonoSession(ctx)

  await sessionService.removeSession(session)
  sessionService.detachSession(ctx)

  return ctx.json({ status: 'success' })
})
