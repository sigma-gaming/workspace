import { createRouter } from '../trpc'
import { getDetailedBalance } from './get-detailed-balance'
import { getDetailedUser } from './get-detailed-user'

export const meRouter = createRouter({
  getDetailedUser,
  getDetailedBalance,
})
