import { ApiType } from '@apis/games-api'
import { hc } from 'hono/client'
import { env } from '../../env'
import { getSentryTracing } from '../../sentry'

export const gamesApi = hc<ApiType>(env.gamesApi.url, {
  fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
    const headers: HeadersInit = {}
    const tracing = getSentryTracing()
    if (tracing) headers['sentry-trace'] = tracing.trace
    if (tracing) headers.baggage = tracing.baggage
    return fetch(input, { ...requestInit, credentials: 'include', headers })
  },
})
