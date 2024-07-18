import '@core/ui'
import * as Sentry from '@sentry/react'
import ReactDOM from 'react-dom/client'
import { $$app } from './app/model.ts'
import { AppView } from './app/view.tsx'
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

const root = ReactDOM.createRoot(document.querySelector('#root')!)
root.render(<AppView />)

$$app.started()
