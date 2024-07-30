import { gameHistoryService, sessionService } from '@games/services'
import { Hono } from 'hono'

export const getMyGames = new Hono().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx.req)
  const user = sessionService.getUser(session)
  const lastWins = await gameHistoryService.getUserGameHistory(user.id)
  return ctx.json(lastWins)
})
