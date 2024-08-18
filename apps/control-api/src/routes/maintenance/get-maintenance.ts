import { maintenanceCache } from '@games/redis'
import { createRouter } from '../../hono'

export const getMaintenanceRoute = createRouter().get('/', async (ctx) => {
  const maintenanceMode = await maintenanceCache.isMaintenanceMode()
  return ctx.json({ maintenanceMode })
})
