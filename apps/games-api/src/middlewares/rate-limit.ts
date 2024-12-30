import { createRateLimiter } from '@core/server'
import { getIpFromBun } from '@core/server-bun'
import { Context } from 'hono'
import { env } from '../env'

const IpSymbol = Symbol('userIp')

export const limitByIp = createRateLimiter({
  keyGenerator: (ctx: Context) => {
    return ctx.get(IpSymbol) ?? getIpFromBun(ctx)
  },
  skip: (ctx: Context) => {
    if (process.env.NODE_ENV === 'development') return true

    if (env.rateLimit.bypassToken) {
      const token = ctx.req.header('x-bypass-rate-limit')
      if (token === env.rateLimit.bypassToken) return true
    }

    const ip = getIpFromBun(ctx)
    ctx.set(IpSymbol, ip)
    return !ip
  },
})
