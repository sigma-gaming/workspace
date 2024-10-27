import 'reflect-metadata'
import './setup'
import { loggerService } from '@core/logger'
import { createErrorHandler } from '@core/server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serverEnv } from '../shared/env/server'
import { authenticateRoute } from './routes/authenticate'
import { logoutRoute } from './routes/logout'

export const api = new Hono()
  .basePath('/api')
  .use(
    cors({
      origin: [serverEnv.gamesApp.url, serverEnv.controlApp.url],
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .route('/authenticate', authenticateRoute)
  .route('/logout', logoutRoute)

api.onError(
  createErrorHandler({
    showOriginalError: serverEnv.isDev,
    onInternalError: (error, ctx) => {
      loggerService.forRequest(ctx.req).error(error)
    },
  }),
)

export type ApiType = typeof api
