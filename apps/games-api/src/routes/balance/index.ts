import { createRouter } from '../trpc'
import { deposit } from './deposit'
import { withdraw } from './withdraw'

export const balanceRouter = createRouter({
  deposit,
  withdraw,
})
