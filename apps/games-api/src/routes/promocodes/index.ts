import { createRouter } from '../../app/router'
import { applyRoute } from './apply'

export const promocodesRouter = createRouter().route('/apply', applyRoute)
