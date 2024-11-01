import { createLazyInstance, resolveOptions } from '@core/di'
import { NotificationSelect } from '@dbs/games-schema'
import { ChatMessageDetailed } from '@games/model'
import { GamesRedisOptionsToken } from '@games/options'
import { PubSub, PubSubService, RedisService } from '@games/redis'
import { Redis } from 'ioredis'
import { gamesRedis } from './redis'

export class GamesPubSubRegistry {
  pub: Redis
  sub: Redis

  notifications: PubSub<NotificationSelect>
  chatMessages: PubSub<ChatMessageDetailed>
  maintenanceStarted: PubSub<void>

  constructor() {
    const { host, password } = resolveOptions(GamesRedisOptionsToken)

    const { redis: subRedis } = new RedisService({
      host,
      password,
    })

    const { redis } = gamesRedis

    this.pub = redis
    this.sub = subRedis

    const pubsubService = new PubSubService({ redis, subRedis })

    this.notifications = pubsubService.create<NotificationSelect>({
      channelName: 'notifications',
    })

    this.chatMessages = pubsubService.create<ChatMessageDetailed>({
      channelName: 'chat-messages',
    })

    this.maintenanceStarted = pubsubService.create<void>({
      channelName: 'maintenance-started',
    })
  }
}

export const gamesPubsubs = createLazyInstance(GamesPubSubRegistry)
