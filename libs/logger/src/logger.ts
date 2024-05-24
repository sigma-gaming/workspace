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

  constructor(@inject(LoggerOptionsToken) options: LoggerOptions) {
    this.logger = createNeodxLogger({
      target: options.pretty ? pretty() : json(),
    })
  }
}

export const logger = createSingletonProxy(
  LoggerService,
  (service) => service.logger,
)

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
      simple: options.pretty,
      logger,
      shouldLogRequest: true,
      getRequestId: generateReqId,
      getRequestMeta: (ctx) => ({
        req: serializeReq(ctx.req),
      }),
      getResponseMeta: (ctx) => ({
        statusCode: ctx.res.statusCode,
        responseTime: ctx.responseTime,
        req: serializeReq(ctx.req),
      }),
    })
  }

  genReqId = generateReqId

  attach = (app: FastifyInstance) => {
    app.addHook('onRequest', (request, reply, done) => {
      this.httpLogger(request.raw, reply.raw, done)
    })

    app.addHook('onSend', (request, reply, payloadUnknown, done) => {
      const requestId = request.id

      const data = {
        requestId,
        displayMessage: `Replied to request ${requestId}`,
        statusCode: reply.statusCode,
        reply: typeof payloadUnknown === 'string' ? payloadUnknown : null,
        req: serializeReq(request.raw),
      }

      if (reply.statusCode >= 400) {
        logger.error(data)
      } else if (!this.options.pretty && reply.statusCode >= 200) {
        logger.info(data)
      }

      return done()
    })
  }
}

export const fastifyLogger = createSingletonProxy(FastifyLoggerService)

function serializeReq(req: IncomingMessage) {
  const sessionCookieIndex = req.headers.cookie?.indexOf('session') ?? -1

  const cookie =
    sessionCookieIndex !== -1
      ? req.headers.cookie?.slice(sessionCookieIndex, sessionCookieIndex + 500)
      : req.headers.cookie

  return {
    id: req.id,
    url: req.url,
    method: req.method,
    headers: {
      'host': req.headers.host,
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin,
      'x-trace-id': req.headers['x-trace-id'],
      cookie,
    },
  }
}
