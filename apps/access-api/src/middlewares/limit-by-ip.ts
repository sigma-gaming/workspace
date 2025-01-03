import { createRateLimiter } from '@core/server'
import { Context } from 'hono'
import { AppEnv } from '../app/base'

export const limitByIp = createRateLimiter({
  keyGenerator: (ctx: Context<AppEnv>) => {
    return ctx.env.ip
  },
  skip: (ctx: Context<AppEnv>) => {
    if (process.env.NODE_ENV === 'development') return true
    return !ctx.env.ip
  },
})
