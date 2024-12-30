import { redirectRoute } from '../routes/redirect'
import { baseApp } from './base'

export const app = baseApp.route('/r/:code', redirectRoute)

export type ApiType = typeof app
