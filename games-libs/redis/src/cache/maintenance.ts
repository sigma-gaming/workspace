import { createSingletonProxy } from '@core/di'
import { Logger, LoggerService } from '@core/logger'
import { Redis } from 'ioredis'
import { singleton } from 'tsyringe'
import { RedisService } from '../redis'
import { GlobalBooleanEntityService } from './entity-boolean'

@singleton()
export class MaintenanceCacheService {
  private readonly redis: Redis
  private readonly logger: Logger
  private readonly entity: GlobalBooleanEntityService

  constructor(redisService: RedisService, loggerService: LoggerService) {
    this.redis = redisService.redis
    this.logger = loggerService.logger.child('MaintenanceCache')

    this.entity = new GlobalBooleanEntityService({
      key: 'global:maintenance',
      ttl: Infinity,
    })
  }

  async isMaintenanceMode() {
    if (this.redis.status !== 'ready') {
      return true
    }

    for (let i = 0; i < 3; i++) {
      try {
        const value = await this.entity.get()
        return value ?? false
      } catch (error) {
        this.logger.info('Failed to get maintenance mode:')
        this.logger.error(error)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        this.logger.info('Retrying in 1 second...')
      }
    }

    return true
  }

  async setMaintenanceMode(value: boolean) {
    if (this.redis.status !== 'ready') return null
    await this.entity.set(value)
    return value
  }
}

export const maintenanceCache = createSingletonProxy(MaintenanceCacheService)
