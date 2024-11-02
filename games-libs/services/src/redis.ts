import { createLazyInstance, resolveOptions, Shutdownable } from '@core/di'
import { logger } from '@core/logger'
import { GamesRedisOptionsToken } from '@games/options'
import { RedisService, RedlockService } from '@games/redis'
import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

export class GamesRedis extends Shutdownable {
  readonly redis: Redis
  readonly redlock: Redlock

  constructor() {
    super()

    const { host, password } = resolveOptions(GamesRedisOptionsToken)

    const { redis } = new RedisService({ host, password })
    const { redlock } = new RedlockService(redis)

    this.redis = redis
    this.redlock = redlock
  }

  get ready() {
    return this.redis.status === 'ready'
  }

  async shutdown() {
    if (!this.ready) {
      logger.info('Redis is not ready, skipping shutdown')
      return
    }

    logger.info('Shutting down Redis...')
    await this.redis.quit()
    logger.info('Redis shutdown complete')
  }
}

export const gamesRedis = createLazyInstance(GamesRedis)
