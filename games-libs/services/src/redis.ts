import { createLazyInstance, resolveOptions } from '@core/di'
import { GamesRedisOptionsToken } from '@games/options'
import { RedisService, RedlockService } from '@games/redis'
import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

export class GamesRedis {
  readonly redis: Redis
  readonly redlock: Redlock

  constructor() {
    const { host, password } = resolveOptions(GamesRedisOptionsToken)

    const { redis } = new RedisService({ host, password })
    const { redlock } = new RedlockService(redis)

    this.redis = redis
    this.redlock = redlock
  }

  get ready() {
    return this.redis.status === 'ready'
  }
}

export const gamesRedis = createLazyInstance(GamesRedis)
