import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

export function createRedlock(redis: Redis) {
  return new Redlock([redis], {
    // http://redis.io/topics/distlock
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
    automaticExtensionThreshold: 500,
  })
}
