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
import { v4 as uuid } from 'uuid'
import { Connect } from 'vite'
import IncomingMessage = Connect.IncomingMessage

export type Logger = NeodxLogger<DefaultLoggerLevel>

export function createLogger(options: { pretty?: boolean }): Logger {
  return createNeodxLogger({
    target: options.pretty ? pretty() : json(),
  })
}

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

export function createFastifyLogger(options: {
  logger: Logger
  pretty?: boolean
}) {
  const httpLogger = createHttpLogger<
    RawRequestDefaultExpression,
    RawReplyDefaultExpression
  >({
    simple: options.pretty,
    logger: options.logger,
    shouldLogRequest: true,
    getRequestId: (req) => {
      const existingID = req.headers['x-trace-id']
      if (existingID) return existingID.toString()
      const id = uuid()
      req.headers['x-trace-id'] = id
      return id
    },
    getRequestMeta: (ctx) => ({
      req: serializeReq(ctx.req),
    }),
    getResponseMeta: (ctx) => ({
      statusCode: ctx.res.statusCode,
      responseTime: ctx.responseTime,
      req: serializeReq(ctx.req),
    }),
  })

  const genReqId = (req: IncomingMessage) => {
    const existingID = req.headers['x-trace-id']
    if (existingID) return existingID.toString()
    const id = uuid()
    req.headers['x-trace-id'] = id
    return id
  }

  const attach = (app: FastifyInstance) => {
    app.addHook('onRequest', (request, reply, done) => {
      httpLogger(request.raw, reply.raw, done)
    })

    app.addHook('onSend', (request, reply, payloadUnknown, done) => {
      const requestId = request.id
      const payload = typeof payloadUnknown === 'string' ? payloadUnknown : null

      if (reply.statusCode >= 400) {
        options.logger.error({ requestId, payload })
      } else if (!options.pretty && reply.statusCode >= 200) {
        options.logger.info({ requestId, payload })
      }

      return done()
    })
  }

  return {
    httpLogger,
    genReqId,
    attach,
  }
}
