import { createRateLimiter } from '@core/server'
import { Context } from 'hono'
import { AppEnv } from '../app/base'
import { env } from '../env'

export const limitByIp = createRateLimiter({
  keyGenerator: (ctx: Context<AppEnv>) => {
    return ctx.env.ip
  },
  skip: (ctx: Context<AppEnv>) => {
    if (process.env.NODE_ENV === 'development') return true

    if (env.rateLimit.bypassToken) {
      const token = ctx.req.header('x-bypass-rate-limit')
      if (token === env.rateLimit.bypassToken) return true
    }

    return !ctx.env.ip
  },
})
