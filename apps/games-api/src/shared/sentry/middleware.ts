import * as Sentry from '@sentry/bun'
import { MiddlewareHandler } from 'hono'
import { sentry } from './init'

type Options = {
  enabled?: boolean
}

export const sentryMiddleware =
  (options: Options): MiddlewareHandler =>
  (ctx, next) => {
    if (!options.enabled) {
      return next()
    }

    const traceId = ctx.req.header('sentry-trace')
    const baggage = ctx.req.header('baggage')

    if (!traceId || !baggage) {
      return next()
    }

    return Sentry.continueTrace({ sentryTrace: traceId, baggage }, () => {
      const url = new URL(ctx.req.url)

      return Sentry.startSpan(
        {
          name: `${ctx.req.method} ${ctx.req.path}`,
          op: 'http.server',
          attributes: {
            'http.query': url.search,
            'http.request.method': ctx.req.method,
            'server.address': url.hostname,
          },
        },
        async (span) => {
          await next()

          span.setAttribute('http.response.status_code', ctx.res.status)

          if (ctx.error) {
            sentry?.captureException(ctx.error)
          }
        },
      )
    })
  }
