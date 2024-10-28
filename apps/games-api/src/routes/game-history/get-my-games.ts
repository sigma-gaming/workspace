import { gameHistoryService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getMyGamesRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const lastWins = await gameHistoryService.getUserGameHistory(userId)
  return ctx.json(lastWins)
})
