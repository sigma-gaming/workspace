import { gameHistoryService } from '@games/services'
import { Hono } from 'hono'

export const getBigWins = new Hono().get('/', async (ctx) => {
  const bigWins = await gameHistoryService.getBigWinHistory()
  return ctx.json(bigWins)
})
