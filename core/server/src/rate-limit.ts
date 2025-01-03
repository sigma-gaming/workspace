import { TooManyRequestsException } from '@core/exceptions'
import { Context, Env } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'

type MiddlewareOptions = {
  limit: number
  windowMs: number
}

const DEFAULT_HANDLER = () => {
  throw new TooManyRequestsException()
}

export function createRateLimiter<E extends Env>({
  keyGenerator,
  skip,
  handler = DEFAULT_HANDLER,
}: {
  keyGenerator: (ctx: Context<E>) => string
  skip: (ctx: Context<E>) => boolean
  handler?: (ctx: Context<E>) => Response
}) {
  return function rateLimit({ limit, windowMs }: MiddlewareOptions) {
    return rateLimiter<E, any, object>({
      limit,
      windowMs,
      keyGenerator,
      skip,
      handler,
    })
  }
}
