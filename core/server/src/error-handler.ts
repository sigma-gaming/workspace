import { InternalServerException, RouteException } from '@core/exceptions'
import { Context, Env, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { StatusCode } from 'hono/utils/http-status'

export function createErrorHandler<E extends Env>(options: {
  showOriginalError?: boolean
  onInternalError?: (error: Error, ctx: Context<E>) => void
}): ErrorHandler<E> {
  return (error, ctx) => {
    if (error instanceof HTTPException) {
      return error.getResponse()
    }

    let exception: RouteException<unknown>

    if (error instanceof RouteException) {
      exception = error
    } else if (options.showOriginalError) {
      exception = new InternalServerException({ cause: error })
    } else {
      exception = new InternalServerException()
    }

    if (exception instanceof InternalServerException) {
      const cause = exception.payload?.cause
      if (cause) options.onInternalError?.(cause, ctx)
    }

    const { name, message, payload, statusCode } = exception
    return ctx.json({ name, message, payload }, statusCode as StatusCode)
  }
}
