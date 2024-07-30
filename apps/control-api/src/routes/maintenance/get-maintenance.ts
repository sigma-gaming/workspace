import { maintenanceCache } from '@games/redis'
import { Hono } from 'hono'

export const getMaintenanceRoute = new Hono().get('/', async (ctx) => {
  const maintenanceMode = await maintenanceCache.isMaintenanceMode()
  return ctx.json({ maintenanceMode })
})
