import {
  InternalServerException,
  RouteException,
  ValidationException,
} from '@core/exceptions'
import { WsAction, WsActionHandler } from '@core/io-client'
import { logger } from '@core/logger'
import { createDefer } from '@core/utils'
import { env } from '@games/services'
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

        if (env.isProd) sentry?.captureException(error)
        logger.child('WsAction').child(name).error(error)
        const exception = new InternalServerException()
        return ack([0, exception])
      }
    }

    return {
      name,
      handler: withTracing(name, ctx, actionHandler),
    }
  }
}

export const withTracing = <TInput, TOutput>(
  name: string,
  ctx: Context,
  handler: WsActionHandler<TInput, TOutput>,
): WsActionHandler<TInput, TOutput> => {
  return (input, ack) => {
    if (env.isDev) {
      return handler(input, ack)
    }

    return Sentry.startNewTrace(() => {
      return Sentry.startSpan(
        {
          name: `WsAction ${name}`,
          op: 'ws.action',
          attributes: {
            'server.address': ctx.url.hostname,
            'user.id': ctx.user.id,
            'user.username': ctx.profile.username ?? 'unknown',
          },
        },
        async (span) => {
          const defer = createDefer()

          handler(input, (result) => {
            span.setAttribute(
              'ws.action.result',
              result[0] === 1 ? 'success' : 'failure',
            )

            ack(result)
            defer.resolve()
          })

          return defer.promise
        },
      )
    })
  }
}
