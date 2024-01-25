import { Redis } from 'ioredis'

export function createMaintenanceStorage(redisUrl = process.env.REDIS_URL) {
  if (!redisUrl) throw new Error('No redisUrl was provided')
  const client = new Redis(redisUrl)

  return {
    async isMaintenanceMode() {
      if (client.status !== 'ready') {
        return true
      }

      for (let i = 0; i < 3; i++) {
        try {
          const value = await client.get('global:maintenance')
          return value === 'true'
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
      if (client.status !== 'ready') return null
      await client.set('global:maintenance', String(value))
      return value
    },
  }
}
