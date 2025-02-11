import { Hono } from 'hono'
import { getUserDetailsRoute } from './get-detailed-profile'
import { getUserRoute } from './get-user'

export const meRouter = new Hono()
  .route('/getUserDetails', getUserDetailsRoute)
  .route('/getUser', getUserRoute)
