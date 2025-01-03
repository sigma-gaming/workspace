import { domainRoute } from '../routes/get-actual-domain'
import { redirectRoute } from '../routes/redirect'
import { baseApp } from './base'

export const app = baseApp
  .route('/r/:code', redirectRoute)
  .route('/domain', domainRoute)

export type ApiType = typeof app
