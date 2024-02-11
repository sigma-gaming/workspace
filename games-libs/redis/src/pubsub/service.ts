import { OnApplicationShutdown } from '@libs/di'
import { Logger, LoggerService } from '@libs/logger'
import { Callback, Redis } from 'ioredis'
import { singleton } from 'tsyringe'
import { RedisService, SubRedisService } from '../redis'

type RedisMessageHandler = (channel: string, message: string) => void
type Unsubscribe = () => void

export interface PubSub<TPayload> {
  publish: (payload: TPayload) => Promise<number>
  subscribe: (handler: (payload: TPayload) => void) => Unsubscribe
  unsubscribeAll: Unsubscribe
}

@singleton()
export class PubSubService implements OnApplicationShutdown {
  private readonly logger: Logger
  private readonly redis: Redis
  private readonly subRedis: Redis

  constructor(
    redisService: RedisService,
    subRedisService: SubRedisService,
    loggerService: LoggerService,
  ) {
    this.redis = redisService.redis
    this.subRedis = subRedisService.redis
    this.logger = loggerService.logger.child('GamesPubSub')
  }

  private subscribedPubSubs = new Set<string>()

  create<TPayload>(options: { channelName: string }): PubSub<TPayload> {
    const { channelName } = options
    let subscribed = false
    const listeners = new Set<RedisMessageHandler>()

    const subscribeHandler: Callback<unknown> = (error, count) => {
      if (error) {
        subscribed = false
        const message = `Failed to subscribe to "${channelName}" channel: ${error}`
        this.logger.error(message)
        return
      }

      const message = `Subscribed to "${channelName}" channel (${count})`
      this.logger.info(message)
      this.subscribedPubSubs.add(channelName)
    }

    const unsubscribeHandler: Callback<unknown> = (error) => {
      if (error) {
        subscribed = true
        const message = `[Redis] Failed to unsubscribe from "${channelName}" channel: ${error}`
        this.logger.error(message)
        return
      }

      this.subscribedPubSubs.delete(channelName)
    }

    return {
      publish: async (payload) => {
        return this.redis.publish(channelName, JSON.stringify(payload))
      },
      subscribe: (handler) => {
        if (!subscribed) {
          subscribed = true // optimistic update, revert on error
          this.subRedis.subscribe(channelName, subscribeHandler)
        }

        const listener: RedisMessageHandler = async (channel, message) => {
          if (channel !== channelName) {
            return
          }

          const payload = JSON.parse(message) as TPayload
          handler(payload)
        }

        this.subRedis.on('message', listener)
        listeners.add(listener)

        return () => {
          this.subRedis.off('message', listener)
          listeners.delete(listener)

          if (listeners.size === 0) {
            subscribed = false // optimistic update, revert on error
            this.subRedis.unsubscribe(channelName, unsubscribeHandler)
          }
        }
      },
      unsubscribeAll: () => {
        listeners.forEach((listener) => {
          this.subRedis.off('message', listener)
          listeners.delete(listener)
        })

        this.subRedis.unsubscribe(channelName, unsubscribeHandler)
      },
    }
  }

  unsubscribeAll() {
    return this.subRedis.unsubscribe(...this.subscribedPubSubs, (error) => {
      if (error) {
        const message = `Failed to unsubscribe from all channels: ${error}`
        this.logger.error(message)
        return
      }

      this.subscribedPubSubs.clear()
    })
  }

  shutdownBefore = [RedisService, SubRedisService]

  async onApplicationShutdown() {
    this.logger.info('Unsubscribing from all channels...')
    await this.unsubscribeAll()
    this.logger.info('Successfully unsubscribed from all channels')
  }
}
