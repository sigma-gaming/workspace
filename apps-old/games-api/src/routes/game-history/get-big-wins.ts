import { gameHistoryService } from '@games/services'
import { Hono } from 'hono'

export const getBigWinsRoute = new Hono().get('/', async (ctx) => {
  const bigWins = await gameHistoryService.getBigWinHistory()
  return ctx.json(bigWins)
})
