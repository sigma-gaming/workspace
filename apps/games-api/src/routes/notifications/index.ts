import { createRouter } from '../../app/router'
import { getActualRoute } from './get-actual'

export const notificationsRouter = createRouter().route(
  '/getActual',
  getActualRoute,
)
