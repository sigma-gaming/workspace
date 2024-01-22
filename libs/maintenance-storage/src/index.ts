import { Redis } from 'ioredis'

export function createMaintenanceStorage(redisUrl = process.env.REDIS_URL) {
  if (!redisUrl) throw new Error('No redisUrl was provided')
  const client = new Redis(redisUrl)

  return {
    async isMaintenanceMode() {
      if (client.status !== 'ready') return true
      const value = await client.get('global:maintenance')
      return value === 'true'
    },
    async setMaintenanceMode(value: boolean) {
      if (client.status !== 'ready') return null
      await client.set('global:maintenance', String(value))
      return value
    },
  }
}
