import { createRouter } from '../trpc'
import { deposit } from './deposit'

export const balanceRouter = createRouter({
  deposit,
})
