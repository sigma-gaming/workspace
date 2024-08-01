import {
  InternalServerException,
  RouteException,
  ValidationException,
} from '@core/exceptions'
import { WsAction } from '@core/io-client'
import { logger } from '@core/logger'
import { Schema } from 'zod'
import { Context } from './context'

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
    return {
      name,
      async handler(input, ack) {
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

          logger.child('WsAction').child(name).error(error)
          const exception = new InternalServerException()
          return ack([0, exception])
        }
      },
    }
  }
}
