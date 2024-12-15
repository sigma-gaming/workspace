import { randomUUID } from 'crypto'
import { Context } from 'hono'
import { createMiddleware } from 'hono/factory'

function generateReqId(ctx: Context) {
  const existingID = ctx.req.header('x-trace-id')
  if (existingID) return existingID
  const id = randomUUID()
  ctx.header('x-trace-id', id)
  return id
}

export const requestIdMiddleware = createMiddleware<{
  Variables: {
    requestId: string
  }
}>(async (ctx, next) => {
  const requestId = generateReqId(ctx)
  ctx.set('requestId', requestId)
  await next()
})
