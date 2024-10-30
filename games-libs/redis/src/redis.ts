import { Logger, loggerService } from '@core/logger'
import { Redis } from 'ioredis'

export type RedisOptions = {
  host: string
  password: string
}

export class RedisService {
  redis: Redis
  logger: Logger

  constructor(options: RedisOptions) {
    this.redis = new Redis({
      host: options.host,
      password: options.password,
    })

    this.logger = loggerService.logger.child('GamesRedis')
  }

  async onApplicationShutdown() {
    this.logger.info('Shutting down...')
    await this.redis.quit()
    this.logger.info('Shutdown complete')
  }
}

export class SubRedisService {
  redis: Redis
  logger: Logger

  constructor(options: RedisOptions) {
    this.redis = new Redis({
      host: options.host,
      password: options.password,
      lazyConnect: true,
    })

    this.logger = loggerService.logger.child('GamesSubRedis')
  }

  async onApplicationShutdown() {
    this.logger.info('Shutting down...')
    await this.redis.quit()
    this.logger.info('Shutdown complete')
  }
}
