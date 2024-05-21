import { createRouter } from '../trpc'
import { getDetailedBalance } from './get-detailed-balance'
import { getDetailedProfile } from './get-detailed-profile'
import { getUser } from './get-user'

export const meRouter = createRouter({
  getDetailedProfile,
  getUser,
  getDetailedBalance,
})
