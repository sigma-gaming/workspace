import { createRouter } from '../../hono'
import { depositRoute } from './deposit'
import { getConfigRoute } from './get-config'
import { withdrawRoute } from './withdraw'

export const paymentsRouter = createRouter()
  .route('/getConfig', getConfigRoute)
  .route('/deposit', depositRoute)
  .route('/withdraw', withdrawRoute)
