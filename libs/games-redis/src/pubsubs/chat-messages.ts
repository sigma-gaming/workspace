import { ChatMessage } from '@libs/games-db-schema'
import { Logger } from '@libs/logger'
import { Redis } from 'ioredis'
import { createPubSub } from '../pubsub'

export function createChatMessagesPubSub(dependencies: {
  redis: Redis
  subRedis?: Redis
  logger: Logger
}) {
  return createPubSub<ChatMessage>(
    { channelName: 'chat-messages' },
    dependencies,
  )
}
