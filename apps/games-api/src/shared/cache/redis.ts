import Client from 'ioredis'
import { env } from '../env'

export const redis = new Client(env.redis.url, {
  lazyConnect: true,
})
