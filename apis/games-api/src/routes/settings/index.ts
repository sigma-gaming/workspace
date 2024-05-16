import { createRouter } from '../trpc'
import { updateProfile } from './update-profile'

export const settingsRouter = createRouter({
  updateProfile,
})
