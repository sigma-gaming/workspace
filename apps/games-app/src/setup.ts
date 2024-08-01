import * as Sentry from '@sentry/react'
import { env } from './shared/env/index.ts'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    environment: env.stage,
    release: env.gamesApp.version,
    dsn: 'https://SENTRY_DSN_REMOVED',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1,
    tracePropagationTargets: [env.gamesApi.url, env.gamesWs.url],
  })
}
