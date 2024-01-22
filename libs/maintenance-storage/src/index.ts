import { Redis } from 'ioredis'

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is required')
}

const client = new Redis(process.env.REDIS_URL)

export async function isMaintenanceMode() {
  if (client.status !== 'ready') return true
  const value = await client.get('global:maintenance')
  return value === 'true'
}

export async function setMaintenanceMode(value: boolean) {
  if (client.status !== 'ready') return null
  await client.set('global:maintenance', String(value))
  return value
}
