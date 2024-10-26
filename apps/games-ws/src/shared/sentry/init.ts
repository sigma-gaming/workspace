import * as Sentry from '@sentry/node'
import { env } from '../../env'

export const sentry = Sentry.init({
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesWs.version,
  tracesSampleRate: 1,
})
