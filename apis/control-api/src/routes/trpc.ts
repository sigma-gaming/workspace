import { env } from '@games/services'
import {
  InternalServerException,
  mapTrpcErrorToException,
  ResourceLockedException,
  RouteException,
  ValidationException,
} from '@libs/exceptions'
import { logger } from '@libs/logger'
import { ResourceLockedError } from '@sesamecare-oss/redlock'
import { initTRPC } from '@trpc/server'
import { ZodError } from 'zod'
import { Context } from './context'

const t = initTRPC.context<Context>().create({
  isDev: env.isDev,
  errorFormatter({ shape, error, ctx = {} }) {
    const finish = (exception: RouteException<unknown>) => {
      if (ctx.res) {
        ctx.res.statusCode = exception.statusCode
      }

      return {
        ...shape,
        message: exception.message,
        data: { error: exception.name, payload: exception.payload },
      }
    }

    if (error.cause instanceof ZodError) {
      return finish(
        new ValidationException({
          issues: error.cause.issues,
          fieldErrors: error.cause.formErrors.fieldErrors,
        }),
      )
    }

    if (error.cause instanceof ResourceLockedError) {
      return finish(new ResourceLockedException())
    }

    if (error.cause instanceof RouteException) {
      return finish(error.cause)
    }

    const exception = mapTrpcErrorToException(error)

    if (
      exception instanceof InternalServerException &&
      process.env.NODE_ENV === 'development'
    ) {
      logger.error(error)
    }

    return finish(exception)
  },
})

export const createRouter = t.router
export const procedure = t.procedure
