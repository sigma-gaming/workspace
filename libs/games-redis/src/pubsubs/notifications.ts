import { Logger } from '@libs/logger'
import { Redis } from 'ioredis'
import { z } from 'zod'
import { createPubSub } from '../pubsub'

export const NotificationTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('personal'),
    userId: z.string(),
  }),
  z.object({
    type: z.literal('global'),
  }),
])

export const NotificationContentSchema = z.object({
  title: z.string(),
  message: z.string(),
  color: z.enum(['info', 'success', 'warning', 'error']).optional(),
  autoClose: z.union([z.number(), z.boolean()]).optional(),
  withCloseButton: z.boolean().optional(),
})

export interface NotificationEventPayload {
  target: z.infer<typeof NotificationTargetSchema>
  content: z.infer<typeof NotificationContentSchema>
}

export function createNotificationsPubSub(dependencies: {
  redis: Redis
  subRedis?: Redis
  logger: Logger
}) {
  return createPubSub<NotificationEventPayload>(
    { channelName: 'notifications' },
    dependencies,
  )
}
