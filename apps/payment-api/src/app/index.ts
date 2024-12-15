import { bovapayRoute } from '../routes/bovapay'
import { baseApp } from './base'

export const app = baseApp.route('/bovapay', bovapayRoute)

export type ApiType = typeof app
