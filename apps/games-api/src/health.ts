import { gamesDb } from '@dbs/games-db'
import { gamesRedis, maintenanceCache } from '@games/redis'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const healthyRoute = new Hono().get('/', async (ctx) => {
  return ctx.text('Yes')
})

export const readyRoute = new Hono().get('/', async (ctx) => {
  const redisReady = await gamesRedis
    .ping()
    .then(() => true)
    .catch(() => false)

  if (!redisReady) {
    throw new HTTPException(503)
  }

  if (await maintenanceCache.isMaintenanceMode()) {
    throw new HTTPException(503)
  }

  const postgresReady = await gamesDb
    .execute(sql`SELECT 1`)
    .then(() => true)
    .catch(() => false)

  if (!postgresReady) {
    throw new HTTPException(503)
  }

  return ctx.text('Yes')
})
