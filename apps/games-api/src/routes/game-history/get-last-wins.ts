import { gameHistoryService } from '@games/services'
import { Hono } from 'hono'

export const getLastWins = new Hono().get('/', async (ctx) => {
  const lastWins = await gameHistoryService.getLastWinHistory()
  return ctx.json(lastWins)
})
