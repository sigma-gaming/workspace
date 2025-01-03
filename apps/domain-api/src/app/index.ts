import { getActualDomainRoute } from '../routes/get-actual-domain'
import { baseApp } from './base'

export const app = baseApp.route('/getActualDomain', getActualDomainRoute)

export type ApiType = typeof app
