import { Logger } from '@libs/logger'
import { Redis } from 'ioredis'
import { createNotificationsPubSub } from './notifications'

export function createPubSubs(dependencies: {
  redis: Redis
  subRedis?: Redis
  logger: Logger
}) {
  return {
    notifications: createNotificationsPubSub(dependencies),
  }
}
