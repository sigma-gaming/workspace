import { Hono } from 'hono'
import { getDetailedProfileRoute } from './get-detailed-profile'
import { getUserRoute } from './get-user'

export const meRouter = new Hono()
  .route('/getDetailedProfile', getDetailedProfileRoute)
  .route('/getUser', getUserRoute)
