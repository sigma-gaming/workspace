import { gameHistoryService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getMyGamesRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const lastWins = await gameHistoryService.getUserGameHistory(user.id)
  return ctx.json(lastWins)
})
