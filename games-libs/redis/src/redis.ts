import { Logger, loggerService } from '@core/logger'
import { Redis } from 'ioredis'

export type RedisOptions = {
  host: string
  password: string
  port?: number
  lazyConnect?: boolean
}

export class RedisService {
  redis: Redis
  logger: Logger

  constructor(options: RedisOptions) {
    this.redis = new Redis({
      host: options.host,
      password: options.password,
      port: options.port ?? 6379,
      lazyConnect: options.lazyConnect,
    })

    this.logger = loggerService.logger.child('Redis')
    this.setupConnectionHandler()
    this.setupErrorHandler()
  }

  connectedOnce = false

  private setupConnectionHandler() {
    this.redis.on('connect', () => {
      this.connectedOnce = true
    })
  }

  private setupErrorHandler() {
    this.redis.on('error', (error) => {
      this.logger.info('Redis failure')
      this.logger.error(error)
    })
  }

  get ready() {
    // Service may be created lazily, so the first status check may be false
    // Which usually doesn't affect the actual readiness
    if (!this.connectedOnce) return true
    return this.redis.status === 'ready'
  }
}
