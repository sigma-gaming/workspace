import { createRouter } from '../trpc'
import { getMaintenance } from './get-maintenance'
import { updateMaintenance } from './update-maintenance'

export const settingsRouter = createRouter({
  getMaintenance,
  updateMaintenance,
})
