import { Context, Env, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { StatusCode } from 'hono/utils/http-status'
import { InternalServerException, RouteException } from './exceptions'

export function createErrorHandler(options: {
  onInternalError?: (error: Error, ctx: Context) => void
}): ErrorHandler<Env> {
  return (error, ctx) => {
    if (error instanceof HTTPException) {
      return error.getResponse()
    }

    let exception: RouteException<unknown>

    if (error instanceof RouteException) {
      exception = error
    } else {
      exception = new InternalServerException({ cause: error })
    }

    if (exception instanceof InternalServerException) {
      const cause = exception.payload?.cause
      if (cause) options.onInternalError?.(cause, ctx)
    }

    const { name, message, payload, statusCode } = exception
    return ctx.json({ name, message, payload }, statusCode as StatusCode)
  }
}
