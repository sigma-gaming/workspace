import { env } from '@games/services'
import * as Sentry from '@sentry/node'

export const sentry = Sentry.init({
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesWs.version,
  tracesSampleRate: 1,
})
