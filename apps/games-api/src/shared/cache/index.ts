import {
  createCache,
  createCaches,
  createMaintenanceCache,
  createRedis,
  createRedlock,
} from '@libs/games-cache'
import { env } from '../env'

const redis = createRedis(env.redis.url)
const redlock = createRedlock(redis)

const cache = createCache({ redis, redlock })

export const maintenanceCache = createMaintenanceCache({ cache, redis })
export const caches = createCaches(cache, { version: env.versions.gamesApi })
