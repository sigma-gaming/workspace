import * as Sentry from '@sentry/bun'
import { env } from '../../env'

export const sentry = Sentry.init({
  enabled: env.isProd,
  dsn: 'https://SENTRY_DSN_REMOVED',
  environment: env.stage,
  release: env.gamesTasks.version,
  tracesSampleRate: 1,

  // TODO: Issue with standard instrumentation:
  // https://github.com/getsentry/sentry-javascript/issues/12891
  // https://github.com/oven-sh/bun/issues/13165
  defaultIntegrations: Sentry.getDefaultIntegrations({}).filter(
    (i) => i.name !== 'Http',
  ),
})
