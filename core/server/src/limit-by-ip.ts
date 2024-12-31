import { TooManyRequestsException } from '@core/exceptions'
import { Context, Env } from 'hono'
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
      if (process.env.NODE_ENV === 'development') return true
      return !getIpFromProxy(ctx)
    },
  },
  uws: {
    keyGenerator: (ctx: Context<HonoUwsEnv>) => {
      return ctx.env.ip
    },
    skip: (ctx: Context<HonoUwsEnv>) => {
      if (process.env.NODE_ENV === 'development') return true
      return !ctx.env.ip
    },
  },
}

const handler = () => {
  throw new TooManyRequestsException()
}

type MiddlewareOptions = {
  limit: number
  windowMs: number
  generator?: 'proxy' | 'uws'
}

export function limitByIp({
  limit,
  windowMs,
  generator = 'uws',
}: MiddlewareOptions) {
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

export function createRateLimiter<E extends Env>({
  keyGenerator,
  skip,
}: {
  keyGenerator: (ctx: Context<E>) => string
  skip: (ctx: Context<E>) => boolean
}) {
  const handler = () => {
    throw new TooManyRequestsException()
  }

  return function limitByIp({
    limit,
    windowMs,
  }: Omit<MiddlewareOptions, 'generator'>) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return rateLimiter<E, any, {}>({
      limit,
      windowMs,
      keyGenerator,
      skip,
      handler,
    })
  }
}
