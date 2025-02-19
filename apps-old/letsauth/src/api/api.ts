import './setup'
import {
  createErrorHandler,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serverEnv } from '../shared/env/server'
import { authenticateRoute } from './routes/authenticate'

export const api = new Hono()
  .basePath('/api')
  .use(
    cors({
      origin: [serverEnv.authApi.url],
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
      maxAge: 86400,
    }),
  )
  .use(requestIdMiddleware)
  .use(loggerMiddleware)
  .route('/authenticate', authenticateRoute)

api.onError(
  createErrorHandler({
    showOriginalError: serverEnv.isDev,
    onInternalError: (error, ctx) => {
      const logger = ctx.get('logger')
      logger.error('Internal error')
      logger.error(error)
    },
  }),
)

export type ApiType = typeof api
