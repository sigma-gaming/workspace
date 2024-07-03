import { env } from '@games/services'
import { sentry } from '@hono/sentry'
import Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

const SENTRY_DSN =
  'https://SENTRY_DSN_REMOVED'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: env.stage,
  release: env.gamesApi.version,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1,
  profilesSampleRate: 1,
})

export const sentryMiddleware = sentry({
  dsn: SENTRY_DSN,
  environment: env.stage,
  release: env.gamesApi.version,
})
