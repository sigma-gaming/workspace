import { gameHistoryService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getMyGamesRoute = createRouter().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUser(session)
  const lastWins = await gameHistoryService.getUserGameHistory(user.id)
  return ctx.json(lastWins)
})
