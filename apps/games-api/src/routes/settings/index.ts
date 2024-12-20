import { createRouter } from '../../app/router'
import { updateProfileRoute } from './update-profile'

export const settingsRouter = createRouter().route(
  '/updateProfile',
  updateProfileRoute,
)
