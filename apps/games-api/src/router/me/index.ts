import { Hono } from 'hono'
import { getDetailedBalanceRoute } from './get-detailed-balance'
import { getDetailedProfileRoute } from './get-detailed-profile'
import { getUserRoute } from './get-user'

export const meRouter = new Hono()
  .route('/getDetailedProfile', getDetailedProfileRoute)
  .route('/getDetailedBalance', getDetailedBalanceRoute)
  .route('/getUser', getUserRoute)
