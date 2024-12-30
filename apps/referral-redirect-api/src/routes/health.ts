import { maintenanceService } from '@games/services'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const healthyRoute = new Hono().get('/', async (ctx) => {
  return ctx.text('Yes')
})

export const readyRoute = new Hono().get('/', async (ctx) => {
  if (await maintenanceService.isMaintenanceMode()) {
    throw new HTTPException(503)
  }

  return ctx.text('Yes')
})
