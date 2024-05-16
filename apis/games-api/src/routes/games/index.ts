import { createRouter } from '../trpc'
import { dices } from './dices'

export const gamesRouter = createRouter({
  dices,
})
