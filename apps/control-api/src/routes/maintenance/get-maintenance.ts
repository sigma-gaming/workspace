import { maintenanceService } from '@games/services'
import { createRouter } from '../../hono'

export const getMaintenanceRoute = createRouter().get('/', async (ctx) => {
  const maintenanceMode = await maintenanceService.isMaintenanceMode()
  return ctx.json({ maintenanceMode })
})
