import { createRouter } from '../trpc'
import { getMaintenance } from './get-maintenance'
import { updateMaintenance } from './update-maintenance'

export const maintenanceRouter = createRouter({
  getMaintenance,
  updateMaintenance,
})
