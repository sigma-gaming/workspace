import { Logger, loggerService } from '@core/logger'
import { JSONCodec, Subscription, SubscriptionOptions } from 'nats'
import { NatsService } from '../nats'

export type PubSubSubscription = {
  unsubscribe: () => void
}

export type PubSubOptions = {
  subject: string
  queueGroup?: string
  subscriptionOptions?: Omit<SubscriptionOptions, 'queue'>
}

export type PubSub<TPayload> = {
  publish: (payload: TPayload) => Promise<void>
  subscribe: (
    handler: (payload: TPayload) => void,
  ) => Promise<PubSubSubscription>
}

const codec = JSONCodec()

export class PubSubService {
  private readonly logger: Logger
  private readonly nats: NatsService
  private readonly subscriptions = new Set<Subscription>()

  constructor(options: { nats: NatsService }) {
    this.nats = options.nats
    this.logger = loggerService.logger.child('PubSub')
  }

  create<TPayload>(options: PubSubOptions): PubSub<TPayload> {
    const { subject, queueGroup, subscriptionOptions } = options

    return {
      publish: async (payload: TPayload) => {
        try {
          const data = codec.encode(payload)
          const connection = await this.nats.getConnectionPromise()
          return connection.publish(subject, data)
        } catch (error) {
          this.logger.error('Failed to publish message', { subject, error })
          throw error
        }
      },

      subscribe: async (handler: (payload: TPayload) => void) => {
        try {
          const connection = await this.nats.getConnectionPromise()

          const subscription = connection.subscribe(subject, {
            ...subscriptionOptions,
            queue: queueGroup,
          })

          this.subscriptions.add(subscription)

          const handleMessages = async () => {
            for await (const message of subscription) {
              try {
                const payload = codec.decode(message.data) as TPayload
                handler(payload)
              } catch (error) {
                this.logger.error('Failed to process message', {
                  subject,
                  error,
                })
              }
            }
          }

          handleMessages()

          return {
            unsubscribe: () => {
              subscription.unsubscribe()
              this.subscriptions.delete(subscription)
            },
          }
        } catch (error) {
          this.logger.error('Failed to create subscription', { subject, error })
          throw error
        }
      },
    }
  }

  get ready() {
    return this.nats.ready
  }
}
