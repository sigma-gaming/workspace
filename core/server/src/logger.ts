import { Logger, logger as globalLogger, loggerService } from '@core/logger'
import { createMiddleware } from 'hono/factory'

export const loggerMiddleware = createMiddleware<{
  Variables: {
    logger: Logger
    requestId?: string
  }
}>(async (ctx, next) => {
  const requestId = ctx.get('requestId')
  const { method, path, url } = ctx.req

  const logger = globalLogger.child(
    'HTTP',
    loggerService.isPretty ? {} : { meta: { request_id: requestId } },
  )

  ctx.set('logger', logger)

  const meta: Record<string, any> = {
    req: {
      method,
      path,
      url,
      headers: ctx.req.header(),
    },
  }

  const start = Date.now()

  if (loggerService.isPretty) {
    logger.info(`-> [${method}] ${path}`)
  } else {
    logger.info(meta, 'Request started')
  }

  await next()

  const responseTime = Date.now() - start
  const statusCode = ctx.res.status
  const level = statusCode >= 400 ? 'error' : 'info'

  meta.responseTime = responseTime
  meta.res = {
    statusCode,
    headers: Object.fromEntries(ctx.res.headers.entries()),
  }

  if (loggerService.isPretty) {
    const time =
      responseTime < 1000
        ? responseTime + 'ms'
        : Math.round(responseTime / 1000) + 's'

    logger[level](`<- [${method}] ${path} ${statusCode} ${time}`)
  } else {
    logger[level](meta, 'Request completed')
  }
})
