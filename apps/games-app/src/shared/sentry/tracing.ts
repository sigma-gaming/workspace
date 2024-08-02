import * as Sentry from '@sentry/react'

export function getSentryTracing() {
  const activeSpan = Sentry.getActiveSpan()
  const rootSpan = activeSpan ? Sentry.getRootSpan(activeSpan) : undefined
  if (!rootSpan) return null

  const trace = Sentry.spanToTraceHeader(rootSpan)
  const baggage = Sentry.spanToBaggageHeader(rootSpan)
  if (!baggage) return null

  return { trace, baggage }
}
