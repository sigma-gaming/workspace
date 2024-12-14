import { maintenanceService } from '@games/services'
import { createRouter } from '../../hono'

export const getStateRoute = createRouter().get('/', async (ctx) => {
  const maintenanceEnabled = await maintenanceService.isMaintenanceMode()
  const backgroundJobsEnabled =
    await maintenanceService.areBackgroundJobsEnabled()
  return ctx.json({ maintenanceEnabled, backgroundJobsEnabled })
})
