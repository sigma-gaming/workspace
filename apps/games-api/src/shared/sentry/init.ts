import { env } from '@games/services'
import * as Sentry from '@sentry/bun'

export const sentry = Sentry.init({
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesApi.version,
  tracesSampleRate: 1,
})
