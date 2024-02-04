import { maintenanceCache } from '../../shared/cache'
import { procedure } from '../trpc'

export const getMaintenance = procedure.query(async () => {
  return { maintenanceMode: await maintenanceCache.isMaintenanceMode() }
})
