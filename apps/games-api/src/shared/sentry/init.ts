import { env } from '@games/services'
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

export const sentry = Sentry.init({
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesApi.version,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.anrIntegration({ captureStackTrace: true }),
  ],
  tracesSampleRate: 1,
  profilesSampleRate: 1,
})
