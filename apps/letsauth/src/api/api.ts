import './setup'
import { logger } from '@core/logger'
import { createErrorHandler } from '@core/server'
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
    }),
  )
  .route('/authenticate', authenticateRoute)

api.onError(
  createErrorHandler({
    showOriginalError: serverEnv.isDev,
    onInternalError: (error) => {
      logger.child('Request').error(error)
    },
  }),
)

export type ApiType = typeof api
