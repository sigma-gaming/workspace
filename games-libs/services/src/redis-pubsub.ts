import { createLazyInstance, resolveOptions } from '@core/di'
import { GamesRedisOptionsToken } from '@games/options'
import { RedisService } from '@games/redis'
import { Redis } from 'ioredis'
import { gamesRedis } from './redis'

export class RedisPubSub {
  pub: Redis
  sub: Redis

  constructor() {
    const options = resolveOptions(GamesRedisOptionsToken)

    const { redis: subRedis } = new RedisService(options)

    const { redis } = gamesRedis

    this.pub = redis
    this.sub = subRedis
  }

  get ready() {
    return this.pub.status === 'ready'
  }
}

export const redisPubsub = createLazyInstance(RedisPubSub)
