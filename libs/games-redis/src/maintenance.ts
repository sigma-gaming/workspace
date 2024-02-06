import { Logger } from '@libs/logger'
import { Redis } from 'ioredis'
import { Cache } from './cache'

export function createMaintenanceCache(dependencies: {
  redis: Redis
  cache: Cache
  logger: Logger
}) {
  const { cache, redis } = dependencies
  const logger = dependencies.logger.child('MaintenanceCache')

  const entity = cache.entity<void, boolean>({
    keygen: () => `global:maintenance`,
    options: { ttl: Infinity },
  })

  return {
    async isMaintenanceMode() {
      if (redis.status !== 'ready') {
        return true
      }

      for (let i = 0; i < 3; i++) {
        try {
          const value = await entity.get()
          return Boolean(value)
        } catch (error) {
          logger.info('Failed to get maintenance mode:')
          logger.error(error)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          logger.info('Retrying in 1 second...')
        }
      }

      return true
    },
    async setMaintenanceMode(value: boolean) {
      if (redis.status !== 'ready') return null
      await entity.set(value)
      return value
    },
  }
}
