import { Redlock } from '@sesamecare-oss/redlock'
import Client from 'ioredis'
import { env } from '../env'

export const redis = new Client(env.redis.url)

export const redlock = new Redlock([redis], {
  // http://redis.io/topics/distlock
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500,
})
