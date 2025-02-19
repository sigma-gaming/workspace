import { exchangeRoute } from '../routes/exchange'
import { logoutRoute } from '../routes/logout'
import { refreshRoute } from '../routes/refresh'
import { baseApp } from './base'

export const app = baseApp
  .route('/exchange', exchangeRoute)
  .route('/refresh', refreshRoute)
  .route('/logout', logoutRoute)

export type ApiType = typeof app
