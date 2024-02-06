import {
  createCache,
  createCaches,
  createMaintenanceCache,
  createPubSubs,
  createRedis,
  createRedlock,
} from '@libs/games-redis'
import { env } from '../env'
import { logger } from '../logger'

const redis = createRedis(env.redis.url)
const redlock = createRedlock({ redis })
const cache = createCache({ redis, redlock, logger })

export const maintenanceCache = createMaintenanceCache({ cache, redis, logger })
export const caches = createCaches({ version: env.gamesApi.version }, { cache })

export const pubsubs = createPubSubs({ redis, logger })

export async function shutdownRedis() {
  logger.info('Shutting down Redis..')
  await redlock.quit()
  logger.info('Redis shutdown complete')
}
