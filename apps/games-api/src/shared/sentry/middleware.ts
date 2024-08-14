import { sessionService } from '@games/services'
import * as Sentry from '@sentry/node'
import { MiddlewareHandler } from 'hono'
import { sentry } from './init'

type Options = {
  enabled?: boolean
}

export const sentryMiddleware =
  (options: Options): MiddlewareHandler =>
  async (ctx, next) => {
    if (!options.enabled) {
      return next()
    }

    const traceId = ctx.req.header('sentry-trace')
    const baggage = ctx.req.header('baggage')

    if (!traceId || !baggage) {
      return next()
    }

    const user = await sessionService.getHonoUserSafe(ctx)

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
            'user.id': user?.id,
          },
        },
        async (span) => {
          await next()

          span.setAttribute('http.response.status_code', ctx.res.status)

          if (ctx.res.status >= 500 && ctx.error) {
            sentry?.captureException(ctx.error)
          }
        },
      )
    })
  }
