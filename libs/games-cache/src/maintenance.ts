import { Redis } from 'ioredis'
import { Cache } from './cache'

export function createMaintenanceCache(options: {
  cache: Cache
  redis: Redis
}) {
  const { cache, redis } = options

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
          console.log('[Maintenance Storage] Failed to get maintenance mode:')
          console.error(error)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          console.log('[Maintenance Storage] Retrying in 1 second...')
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
