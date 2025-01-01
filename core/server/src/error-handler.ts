import { InternalServerException, RouteException } from '@core/exceptions'
import { Context, Env, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ContentfulStatusCode } from 'hono/utils/http-status'

export function createErrorHandler<E extends Env>(options: {
  showOriginalError?: boolean
  onInternalError?: (error: unknown, ctx: Context<E>) => void
}): ErrorHandler<E> {
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
      const cause = exception.payload?.cause ?? null
      options.onInternalError?.(cause, ctx)
    }

    if (
      exception instanceof InternalServerException &&
      !options.showOriginalError
    ) {
      exception = new InternalServerException()
    }

    const { name, message, payload, statusCode } = exception

    return ctx.json(
      { name, message, payload },
      statusCode as ContentfulStatusCode,
    )
  }
}
