import { domainRoute } from '../routes/get-actual-domain'
import { domainsRoute } from '../routes/get-actual-domains'
import { redirectRoute } from '../routes/redirect'
import { baseApp } from './base'

export const app = baseApp
  .route('/r/:code', redirectRoute)
  .route('/domain', domainRoute)
  .route('/domains', domainsRoute)

export type ApiType = typeof app
