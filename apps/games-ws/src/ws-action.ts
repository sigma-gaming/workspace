import { randomUUID } from 'crypto'
import {
  InternalServerException,
  RouteException,
  ValidationException,
} from '@core/exceptions'
import { WsAction, WsActionHandler } from '@core/io-client'
import { Logger, logger as globalLogger, loggerService } from '@core/logger'
import { createDefer } from '@core/utils'
import * as Sentry from '@sentry/node'
import { Schema } from 'zod'
import { Context } from './context'
import { env } from './env'
import { sentry } from './shared/sentry'

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
  log?: boolean
  handler: (
    ctx: Context & { logger: Logger },
    input: TInput,
  ) => Promise<TOutput>
}): WsActionGenerator<TName, TInput, TOutput> {
  const { name, schema, log = true, handler } = options

  return (ctx) => {
    const actionHandler: WsActionHandler<TInput, TOutput> = async (
      input,
      ack,
    ) => {
      const requestId = randomUUID()

      const logger = globalLogger.child(
        'WsAction',
        loggerService.isPretty ? {} : { meta: { request_id: requestId } },
      )

      const meta: Record<string, any> = {
        user_id: ctx.session?.userId,
        req: { path: name },
      }

      const start = Date.now()
      let logLevel: 'info' | 'error' = 'info'

      if (log) {
        if (loggerService.isPretty) {
          logger.info(`-> ${name}`)
        } else {
          logger.info(meta, 'WsAction started')
        }
      }

      try {
        let parsed = undefined as TInput

        if (schema) {
          const validation = schema.safeParse(input)

          if (!validation.success) {
            const { formErrors, issues } = validation.error
            const { fieldErrors } = formErrors

            throw new ValidationException({
              issues,
              fieldErrors,
            })
          }

          parsed = validation.data
        }

        const output = await handler({ ...ctx, logger }, parsed)
        meta.res = { status: 'success' }

        return ack([1, output])
      } catch (error) {
        logLevel = 'error'
        meta.res = { status: 'failure' }

        if (error instanceof RouteException) {
          return ack([0, error])
        }

        if (env.isProd) sentry?.captureException(error)
        logger.child('WsAction').child(name).error(error)
        const exception = new InternalServerException()
        return ack([0, exception])
      } finally {
        const responseTime = Date.now() - start

        meta.responseTime = responseTime

        if (log) {
          if (loggerService.isPretty) {
            const time =
              responseTime < 1000
                ? responseTime + 'ms'
                : Math.round(responseTime / 1000) + 's'

            logger[logLevel](`<- ${name} ${time}`)
          } else {
            logger[logLevel](meta, 'WsAction completed')
          }
        }
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
            'user.id': ctx.session?.userId,
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
