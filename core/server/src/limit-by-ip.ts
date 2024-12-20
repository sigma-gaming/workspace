import { TooManyRequestsException } from '@core/exceptions'
import { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { getIpFromProxy } from './ip'
import { HonoUwsEnv } from './uws'

const generators = {
  proxy: {
    keyGenerator: (ctx: Context) => {
      const ip = getIpFromProxy(ctx)
      if (!ip) throw new Error('No IP found')
      return ip
    },
    skip: (ctx: Context) => {
      return !getIpFromProxy(ctx)
    },
  },
  uws: {
    keyGenerator: (ctx: Context<HonoUwsEnv>) => {
      return ctx.env.ip
    },
    skip: (ctx: Context<HonoUwsEnv>) => {
      return !ctx.env.ip
    },
  },
}

const handler = () => {
  throw new TooManyRequestsException()
}

type Options = {
  limit: number
  windowMs: number
  generator?: 'proxy' | 'uws'
}

export function limitByIp({ limit, windowMs, generator = 'uws' }: Options) {
  const { keyGenerator, skip } = generators[generator]

  // eslint-disable-next-line @typescript-eslint/ban-types
  return rateLimiter<HonoUwsEnv, any, {}>({
    limit,
    windowMs,
    keyGenerator,
    skip,
    handler,
  })
}
