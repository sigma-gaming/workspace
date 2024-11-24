import { createRouter } from '../../hono'
import { depositRoute } from './deposit'
import { withdrawRoute } from './withdraw'

export const paymentsRouter = createRouter()
  .route('/deposit', depositRoute)
  .route('/withdraw', withdrawRoute)
