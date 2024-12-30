import { createRateLimiter } from '@core/server'
import { Context } from 'hono'
import { getIpFromBun } from './ip'

const IpSymbol = Symbol('userIp')

export const limitByIp = createRateLimiter({
  keyGenerator: (ctx: Context) => {
    return ctx.get(IpSymbol) ?? getIpFromBun(ctx)
  },
  skip: (ctx: Context) => {
    if (process.env.NODE_ENV === 'development') return true

    const ip = getIpFromBun(ctx)
    ctx.set(IpSymbol, ip)
    return !ip
  },
})
