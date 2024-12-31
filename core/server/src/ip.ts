import { Context } from 'hono'

export function getIpFromProxy(ctx: Context) {
  const cfIp = ctx.req.header('cf-connecting-ip')
  if (cfIp) return cfIp
  const forwardedFor = ctx.req.header('x-forwarded-for')
  if (!forwardedFor) return null
  return forwardedFor.split(',', 1)[0]?.trim()
}
