import { createLogger } from '@neodx/log'
import { createHttpLogger } from '@neodx/log/http'
import { json, pretty } from '@neodx/log/node'
import { RawReplyDefaultExpression, RawRequestDefaultExpression } from 'fastify'
import { v4 as uuid } from 'uuid'
import { Connect } from 'vite'
import { env } from '../env'
import IncomingMessage = Connect.IncomingMessage

export const logger = createLogger({
  target: env.isProd ? json() : pretty(),
})

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

export const httpLogger = createHttpLogger<
  RawRequestDefaultExpression,
  RawReplyDefaultExpression
>({
  simple: !env.isProd,
  logger,
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
