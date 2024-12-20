import { createRouter } from '../../app/router'
import { getDetailedBalanceRoute } from './get-detailed-balance'
import { getDetailedProfileRoute } from './get-detailed-profile'
import { getUserRoute } from './get-user'

export const meRouter = createRouter()
  .route('/getDetailedProfile', getDetailedProfileRoute)
  .route('/getDetailedBalance', getDetailedBalanceRoute)
  .route('/getUser', getUserRoute)
