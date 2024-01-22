import { createRouter } from '../trpc'
import { updateMaintenance } from './update-maintenance'

export const settingsRouter = createRouter({
  updateMaintenance,
})
