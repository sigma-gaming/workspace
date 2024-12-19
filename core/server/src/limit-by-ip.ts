import { TooManyRequestsException } from '@core/exceptions'
import { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { HonoUwsEnv } from './uws'

type Options = {
  limit: number
  windowMs: number
}

const keyGenerator = (ctx: Context<HonoUwsEnv>) => {
  return ctx.env.ip
}

const handler = () => {
  throw new TooManyRequestsException()
}

export function limitByIp({ limit, windowMs }: Options) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return rateLimiter<HonoUwsEnv, any, {}>({
    limit,
    windowMs,
    keyGenerator,
    handler,
  })
}
