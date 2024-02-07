import { NotificationContent } from '@libs/games-model'
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

export interface NotificationEventPayload {
  target: z.infer<typeof NotificationTargetSchema>
  content: NotificationContent
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
