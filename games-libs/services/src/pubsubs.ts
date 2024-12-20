import { createLazyInstance, resolveOptions, Shutdownable } from '@core/di'
import { logger } from '@core/logger'
import { NotificationSelect } from '@dbs/games-schema'
import {
  BalanceUpdate,
  ChatMessageDetailed,
  GlobalTaskUpdate,
} from '@games/model'
import { GamesRedisOptionsToken } from '@games/options'
import { PubSub, PubSubService, RedisService } from '@games/redis'
import { Redis } from 'ioredis'
import { GamesRedis, gamesRedis } from './redis'

export class GamesPubSubRegistry extends Shutdownable {
  pub: Redis
  sub: Redis
  service: PubSubService

  notifications: PubSub<NotificationSelect>
  chatMessages: PubSub<ChatMessageDetailed>
  maintenanceStarted: PubSub<void>
  balanceUpdated: PubSub<{ userId: string; update: BalanceUpdate }>
  globalTaskUpdated: PubSub<{ userId: string; update: GlobalTaskUpdate }>

  constructor() {
    super()

    const { host, password } = resolveOptions(GamesRedisOptionsToken)

    const { redis: subRedis } = new RedisService({
      host,
      password,
    })

    const { redis } = gamesRedis

    this.pub = redis
    this.sub = subRedis

    this.service = new PubSubService({ redis, subRedis })

    this.notifications = this.service.create<NotificationSelect>({
      channelName: 'notifications',
    })

    this.chatMessages = this.service.create<ChatMessageDetailed>({
      channelName: 'chat-messages',
    })

    this.maintenanceStarted = this.service.create<void>({
      channelName: 'maintenance-started',
    })

    this.balanceUpdated = this.service.create<{
      userId: string
      update: BalanceUpdate
    }>({
      channelName: 'balance-updated',
    })

    this.globalTaskUpdated = this.service.create<{
      userId: string
      update: GlobalTaskUpdate
    }>({
      channelName: 'global-tasks-updated',
    })
  }

  get ready() {
    return this.pub.status === 'ready'
  }

  shutdownBefore = [GamesRedis]

  async shutdown() {
    if (!this.ready) {
      logger.info('PubSub is not ready, skipping shutdown')
      return
    }

    logger.info('Unsubscribing from all channels...')
    await this.service.unsubscribeAll()
    logger.info('Successfully unsubscribed from all channels')
  }
}

export const gamesPubsubs = createLazyInstance(GamesPubSubRegistry)
