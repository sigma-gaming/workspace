import { env } from '@games/services'
import * as Sentry from '@sentry/node'

export const sentry = Sentry.init({
  enabled: env.isProd,
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesTasks.version,
  tracesSampleRate: 1,
})
