import { env } from '@shared/env'
import {
  mapTrpcErrorToException,
  RouteException,
  ValidationException,
} from '@sigma/exceptions'
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
      return finish(new ValidationException(error.cause))
    }

    if (error.cause instanceof RouteException) {
      return finish(error.cause)
    }

    return finish(mapTrpcErrorToException(error))
  },
})

export const createRouter = t.router
export const procedure = t.procedure
