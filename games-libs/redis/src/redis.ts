import { createSingletonProxy, OnApplicationShutdown } from '@libs/di'
import { Logger, LoggerService } from '@libs/logger'
import { Redis } from 'ioredis'
import { inject, InjectionToken, singleton } from 'tsyringe'

export interface RedisOptions {
  url: string
}

export const RedisOptionsToken: InjectionToken<RedisOptions> =
  Symbol('RedisOptions')

@singleton()
export class RedisService implements OnApplicationShutdown {
  redis: Redis
  logger: Logger

  constructor(
    @inject(RedisOptionsToken) options: RedisOptions,
    loggerService: LoggerService,
  ) {
    this.redis = new Redis(options.url)
    this.logger = loggerService.logger.child('GamesRedis')
  }

  async onApplicationShutdown() {
    this.logger.info('Shutting down...')
    await this.redis.quit()
    this.logger.info('Shutdown complete')
  }
}

export const gamesRedis = createSingletonProxy(
  RedisService,
  (service) => service.redis,
)

@singleton()
export class SubRedisService implements OnApplicationShutdown {
  redis: Redis
  logger: Logger

  constructor(
    @inject(RedisOptionsToken) options: RedisOptions,
    loggerService: LoggerService,
  ) {
    this.redis = new Redis(options.url, { lazyConnect: true })
    this.logger = loggerService.logger.child('GamesSubRedis')
  }

  async onApplicationShutdown() {
    this.logger.info('Shutting down...')
    await this.redis.quit()
    this.logger.info('Shutdown complete')
  }
}
