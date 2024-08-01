import {
  InternalServerException,
  RouteException,
  ValidationException,
} from '@core/exceptions'
import { WsAction, WsActionHandler } from '@core/io-client'
import { logger } from '@core/logger'
import * as Sentry from '@sentry/node'
import { Schema } from 'zod'
import { Context } from './context'
import { sentry } from './sentry'

export type WsActionGenerator<TName extends string, TInput, TOutput> = (
  ctx: Context,
) => WsAction<TName, TInput, TOutput>

export function createWsAction<
  TName extends string,
  TInput = void,
  TOutput = void,
>(options: {
  name: TName
  schema?: Schema<TInput>
  handler: (ctx: Context, input: TInput) => Promise<TOutput>
}): WsActionGenerator<TName, TInput, TOutput> {
  const { name, schema, handler } = options

  return (ctx) => {
    const actionHandler: WsActionHandler<TInput, TOutput> = async (
      input,
      ack,
    ) => {
      let parsed = undefined as TInput

      if (schema) {
        const validation = schema.safeParse(input)

        if (!validation.success) {
          const { formErrors, issues } = validation.error
          const { fieldErrors } = formErrors

          const exception = new ValidationException({
            issues,
            fieldErrors,
          })

          return ack([0, exception])
        }

        parsed = validation.data
      }

      try {
        const output = await handler(ctx, parsed)
        return ack([1, output])
      } catch (error) {
        if (error instanceof RouteException) {
          return ack([0, error])
        }

        sentry?.captureException(error)
        logger.child('WsAction').child(name).error(error)
        const exception = new InternalServerException()
        return ack([0, exception])
      }
    }

    return {
      name,
      handler: withSentry(name, ctx, actionHandler),
    }
  }
}

export const withSentry = <TInput, TOutput>(
  name: string,
  ctx: Context,
  handler: WsActionHandler<TInput, TOutput>,
): WsActionHandler<TInput, TOutput> => {
  return (input, ack) => {
    const traceId = ctx.headers['sentry-trace']
    const baggage = ctx.headers.baggage

    console.log({ traceId, baggage })

    if (!traceId || !baggage) {
      return handler(input, ack)
    }

    return Sentry.continueTrace(
      { sentryTrace: String(traceId), baggage },
      () => {
        return Sentry.startSpan(
          {
            name: `WsAction ${name}`,
            op: 'ws.action',
            attributes: {
              'http.query': ctx.url.search,
              'server.address': ctx.url.hostname,
              'user.id': ctx.user.id,
              'user.username': ctx.profile.username ?? 'unknown',
            },
          },
          async (span) => {
            handler(input, (result) => {
              ack(result)

              span.setAttribute(
                'ws.action.result',
                result[0] === 1 ? 'success' : 'failure',
              )
            })
          },
        )
      },
    )
  }
}
