import * as Sentry from '@sentry/bun'
import { env } from '../../env'

export const sentry = Sentry.init({
  enabled: env.isProd,
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesTasks.version,
  tracesSampleRate: 1,
})
