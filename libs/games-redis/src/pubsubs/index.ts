import { Logger } from '@libs/logger'
import { Redis } from 'ioredis'
import { createChatMessagesPubSub } from './chat-messages'
import { createNotificationsPubSub } from './notifications'

export function createPubSubs(dependencies: {
  redis: Redis
  subRedis?: Redis
  logger: Logger
}) {
  return {
    notifications: createNotificationsPubSub(dependencies),
    chatMessages: createChatMessagesPubSub(dependencies),
  }
}
