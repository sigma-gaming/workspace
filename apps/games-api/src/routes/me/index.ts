import { createRouter } from '../../app/router'
import { getBalanceRoute } from './get-detailed-balance'
import { getUserDetailsRoute } from './get-detailed-profile'
import { getUserRoute } from './get-user'

export const meRouter = createRouter()
  .route('/getUserDetails', getUserDetailsRoute)
  .route('/getBalance', getBalanceRoute)
  .route('/getUser', getUserRoute)
