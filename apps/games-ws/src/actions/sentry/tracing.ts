import { z } from 'zod'
import { Context } from '../../context'
import { createWsAction } from '../../ws-action'

const InputSchema = z.object({
  trace: z.string(),
  baggage: z.string(),
})

export type SentryTracingInput = z.infer<typeof InputSchema>

export const SentryTracingAction = createWsAction({
  name: 'sentry/tracing',
  schema: InputSchema,
  async handler(ctx: Context, { trace, baggage }: SentryTracingInput) {
    ctx.sentryTrace = trace
    ctx.sentryBaggage = baggage
  },
})
