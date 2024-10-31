import { Logger, loggerService } from '@core/logger'
import { Redis } from 'ioredis'

export type RedisOptions = {
  host: string
  password: string
  lazyConnect?: boolean
}

export class RedisService {
  redis: Redis
  logger: Logger

  constructor(options: RedisOptions) {
    this.redis = new Redis({
      host: options.host,
      password: options.password,
      lazyConnect: options.lazyConnect,
    })

    this.logger = loggerService.logger.child('Redis')
    this.setupErrorHandler()
  }

  private setupErrorHandler() {
    this.redis.on('error', (error) => {
      this.logger.info('Redis failure')
      this.logger.error(error)
    })
  }

  async onApplicationShutdown() {
    this.logger.info('Shutting down...')
    await this.redis.quit()
    this.logger.info('Shutdown complete')
  }
}
