import { Hono } from 'hono'

export const healthyRoute = new Hono().get('/', async (ctx) => {
  return ctx.text('Yes')
})

export const readyRoute = new Hono().get('/', async (ctx) => {
  return ctx.text('Yes')
})
