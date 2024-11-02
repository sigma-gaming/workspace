import { createLazyInstance, resolveOptions, Shutdownable } from '@core/di'
import { logger } from '@core/logger'
import { GamesRedisOptionsToken } from '@games/options'
import { RedisService, RedlockService } from '@games/redis'
import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

export class GamesRedis extends Shutdownable {
  private redisService: RedisService

  readonly redis: Redis
  readonly redlock: Redlock

  constructor() {
    super()

    const { host, password } = resolveOptions(GamesRedisOptionsToken)

    this.redisService = new RedisService({ host, password })
    this.redis = this.redisService.redis

    const { redlock } = new RedlockService(this.redis)
    this.redlock = redlock
  }

  get ready() {
    return this.redisService.ready
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
