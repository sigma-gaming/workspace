import { Logger } from '@libs/logger'
import { Callback, Redis } from 'ioredis'

type RedisMessageHandler = (channel: string, message: string) => void
type Unsubscribe = () => void

interface PubSub<TPayload> {
  publish: (payload: TPayload) => Promise<number>
  subscribe: (handler: (payload: TPayload) => void) => Unsubscribe
  unsubscribeAll: Unsubscribe
}

const subscribedPubSubs = new Set<string>()

export async function unsubscribeAllPubSubs(dependencies: {
  subRedis: Redis
  logger: Logger
}) {
  const { subRedis } = dependencies
  const logger = dependencies.logger.child('RedisPubSub')

  return subRedis.unsubscribe(...subscribedPubSubs, (error) => {
    if (error) {
      const message = `[Redis] Failed to unsubscribe from all channels: ${error}`
      logger.error(message)
      return
    }

    subscribedPubSubs.clear()
  })
}

export function createPubSub<TPayload>(
  options: { channelName: string },
  dependencies: { redis: Redis; subRedis?: Redis; logger: Logger },
): PubSub<TPayload> {
  const { channelName } = options
  const { redis, subRedis } = dependencies
  const logger = dependencies.logger.child('RedisPubSub')

  const listeners = new Set<RedisMessageHandler>()

  const unsubscribeHandler: Callback<unknown> = (error) => {
    if (error) {
      const message = `[Redis] Failed to unsubscribe from "${channelName}" channel: ${error}`
      logger.error(message)
      return
    }

    subscribedPubSubs.delete(channelName)
  }

  return {
    async publish(payload) {
      return redis.publish(channelName, JSON.stringify(payload))
    },
    subscribe(handler) {
      if (!subRedis) {
        throw new Error('[Redis] subRedis is not provided')
      }

      subRedis.subscribe(channelName, (error, count) => {
        if (error) {
          const message = `[Redis] Failed to subscribe to "${channelName}" channel: ${error}`
          logger.error(message)
          return
        }

        const message = `[Redis] Subscribed to "${channelName}" channel (${count})`
        logger.info(message)
        subscribedPubSubs.add(channelName)
      })

      const listener: RedisMessageHandler = async (channel, message) => {
        if (channel !== channelName) {
          return
        }

        const payload = JSON.parse(message) as TPayload
        handler(payload)
      }

      subRedis.on('message', listener)
      listeners.add(listener)

      return () => {
        subRedis.off('message', listener)
        listeners.delete(listener)

        subRedis.unsubscribe(channelName, unsubscribeHandler)
      }
    },
    unsubscribeAll() {
      if (!subRedis) {
        return
      }

      listeners.forEach((listener) => {
        subRedis.off('message', listener)
        listeners.delete(listener)
      })

      subRedis.unsubscribe(channelName, unsubscribeHandler)
    },
  }
}
