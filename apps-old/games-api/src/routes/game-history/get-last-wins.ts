import { gameHistoryService } from '@games/services'
import { Hono } from 'hono'

export const getLastWinsRoute = new Hono().get('/', async (ctx) => {
  const lastWins = await gameHistoryService.getLastWinHistory()
  return ctx.json(lastWins)
})
