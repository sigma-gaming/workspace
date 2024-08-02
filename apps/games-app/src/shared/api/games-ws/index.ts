import { ClientToServerEvents, ServerToClientEvents } from '@apis/games-ws'
import { createWsEffect } from '@core/io-client'
import * as Sentry from '@sentry/react'
import { io, Socket } from 'socket.io-client'
import { env } from '../../env'

function getSentryTracing() {
  const activeSpan = Sentry.getActiveSpan()
  const rootSpan = activeSpan ? Sentry.getRootSpan(activeSpan) : undefined
  if (!rootSpan) return null

  const trace = Sentry.spanToTraceHeader(rootSpan)
  const baggage = Sentry.spanToBaggageHeader(rootSpan)
  if (!baggage) return null

  return { trace, baggage }
}

const activeSpan = Sentry.getActiveSpan()
const rootSpan = activeSpan ? Sentry.getRootSpan(activeSpan) : undefined

const extraHeaders: Record<string, string> = {}

if (rootSpan) {
  const trace = Sentry.spanToTraceHeader(rootSpan)
  const baggage = Sentry.spanToBaggageHeader(rootSpan)
  extraHeaders['sentry-trace'] = trace
  if (baggage) extraHeaders.baggage = baggage
}

export const gamesWs: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  env.gamesWs.url,
  {
    transports: ['websocket', 'polling', 'webtransport'],
    withCredentials: true,
    extraHeaders,
  },
)

const sendSentryTracingFx = createWsEffect(gamesWs, 'sentry/tracing')

gamesWs.on('connect', () => {
  const tracing = getSentryTracing()
  if (!tracing) return
  sendSentryTracingFx(tracing)
})
