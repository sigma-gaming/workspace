import { createSingletonProxy } from '@libs/di'
import { createColors } from '@neodx/colors'
import {
  createLogger as createNeodxLogger,
  DefaultLoggerLevel,
  Logger as NeodxLogger,
} from '@neodx/log'
import { createHttpLogger } from '@neodx/log/http'
import { json, pretty } from '@neodx/log/node'
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
} from 'fastify'
import { IncomingMessage } from 'node:http'
import { inject, InjectionToken, singleton } from 'tsyringe'
import { v4 as uuid } from 'uuid'

export type Logger = NeodxLogger<DefaultLoggerLevel>

export interface LoggerOptions {
  pretty?: boolean
}

export const LoggerOptionsToken: InjectionToken<LoggerOptions> =
  Symbol('LoggerOptionsToken')

@singleton()
export class LoggerService {
  logger: Logger

  constructor(@inject(LoggerOptionsToken) private options: LoggerOptions) {
    this.logger = createNeodxLogger({
      target: options.pretty ? pretty() : json(),
    })
  }

  createRequestLogger(request: FastifyRequest) {
    if (this.options.pretty) {
      return this.logger.child('Request')
    }

    return this.logger.child('Request', {
      meta: {
        request: {
          id: request.id,
          url: request.url,
        },
        user: {
          id: request.meta?.userId,
          ip: request.ip,
          ips: request.ips,
        },
      },
    })
  }
}

export const loggerService = createSingletonProxy(LoggerService)

export const logger = createSingletonProxy(
  LoggerService,
  (service) => service.logger,
)

declare module 'fastify' {
  export interface FastifyRequest {
    meta?: {
      userId?: string
    }
  }
}

function generateReqId(req: IncomingMessage) {
  const existingID = req.headers['x-trace-id']
  if (existingID) return existingID.toString()
  const id = uuid()
  req.headers['x-trace-id'] = id
  return id
}

@singleton()
export class FastifyLoggerService {
  httpLogger: (
    req: RawRequestDefaultExpression,
    res: RawReplyDefaultExpression,
    done: () => void,
  ) => void

  constructor(@inject(LoggerOptionsToken) private options: LoggerOptions) {
    this.httpLogger = createHttpLogger<
      RawRequestDefaultExpression,
      RawReplyDefaultExpression
    >({
      colors: createColors(false, false),
      logger,
      shouldLogRequest: true,
    })
  }

  genReqId = generateReqId

  attach = (app: FastifyInstance) => {
    app.addHook('onSend', (fastifyRequest, fastifyResponse, payload, done) => {
      if (this.options.pretty) {
        return this.httpLogger(fastifyRequest.raw, fastifyResponse.raw, done)
      }

      const request = serializeRequest(fastifyRequest)
      const response = serializeResponse(fastifyResponse, payload)

      const data = {
        shortMessage: `${request.method} ${request.url} (${response.elapsedTime}ms)`,
        request,
        response,
        user: {
          id: fastifyRequest.meta?.userId,
          ip: fastifyRequest.ip,
          ips: fastifyRequest.ips,
        },
      }

      if (fastifyResponse.statusCode >= 500) {
        logger.error(data)
      } else if (fastifyResponse.statusCode >= 200) {
        logger.info(data)
      }

      return done()
    })
  }
}

export const fastifyLogger = createSingletonProxy(FastifyLoggerService)

function serializeRequest(request: FastifyRequest) {
  const sessionCookieIndex = request.headers.cookie?.indexOf('session') ?? -1

  const cookie =
    sessionCookieIndex !== -1
      ? request.headers.cookie?.slice(
          sessionCookieIndex,
          sessionCookieIndex + 500,
        )
      : request.headers.cookie

  return {
    id: request.id,
    url: request.url,
    method: request.method,
    body: request.body,
    headers: {
      'host': request.headers.host,
      'user-agent': request.headers['user-agent'],
      'origin': request.headers.origin,
      cookie,
    },
  }
}

function serializeResponse(response: FastifyReply, payload: unknown) {
  return {
    statusCode: response.statusCode,
    body: payload,
    elapsedTime: Math.round(response.elapsedTime * 100) / 100,
  }
}
