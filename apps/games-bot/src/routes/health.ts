import { Hono } from 'hono'

export const healthyRoute = new Hono().get('/', async (ctx) => {
  return ctx.text('Yes')
})

export const readyRoute = new Hono().get('/', async (ctx) => {
  // if (await maintenanceService.isMaintenanceEnabled()) {
  //   throw new HTTPException(503)
  // }

  // const postgresHealthy = await gamesDbService.healthy()

  // if (!postgresHealthy) {
  //   throw new HTTPException(503)
  // }

  return ctx.text('Yes')
})
