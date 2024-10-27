import { gamesRedis } from '@games/redis'
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

  return ctx.text('Yes')
})
