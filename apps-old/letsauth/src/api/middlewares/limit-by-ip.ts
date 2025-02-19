import { createRateLimiter, getIpFromProxy } from '@core/server'

export const limitByIp = createRateLimiter({
  keyGenerator: (ctx) => {
    const ip = getIpFromProxy(ctx)
    if (!ip) throw new Error('No IP found')
    return ip
  },
  skip: (ctx) => {
    if (process.env.NODE_ENV === 'development') return true
    return !getIpFromProxy(ctx)
  },
})
