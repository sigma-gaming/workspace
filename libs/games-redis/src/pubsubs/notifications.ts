import { Notification } from '@libs/games-db-schema'
import { Logger } from '@libs/logger'
import { Redis } from 'ioredis'
import { createPubSub } from '../pubsub'

export function createNotificationsPubSub(dependencies: {
  redis: Redis
  subRedis?: Redis
  logger: Logger
}) {
  return createPubSub<Notification>(
    { channelName: 'notifications' },
    dependencies,
  )
}
