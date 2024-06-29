import { createFactory } from '@withease/factories'
import { createEvent, createStore, Event, sample } from 'effector'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface SocketSubscription {
  topic: string
  handler: (payload: any) => void
}

interface TopicSubscriptionModel<
  TTopic extends string,
  TEvent extends { topic: TTopic; payload: unknown },
  TSubscribedTopic extends TTopic,
> {
  pause: Event<void>
  unpause: Event<void>
  reset: Event<void>
  receivedData: Event<Extract<TEvent, { topic: TSubscribedTopic }>['payload']>
}

interface ApiSocket<
  TTopic extends string,
  TEvent extends { topic: TTopic; payload: unknown },
> {
  instance: WebSocket | null
  ready: boolean
  connecting: boolean
  closed: boolean
  subscriptions: Set<SocketSubscription>
  reconnectTries: number
  checkConnection: () => Promise<void>
  reconnect: (tries?: number) => void
  send: (data: unknown) => void
  subscribe: <T extends TTopic>(
    topic: T,
    handler: (payload: Extract<TEvent, { topic: T }>['payload']) => void,
  ) => () => void
  subscriptionFactory: <T extends TTopic>(options: {
    topic: T
    initialActive?: boolean
  }) => TopicSubscriptionModel<TTopic, TEvent, T>
}

const waitingTimes = [1000, 2000, 3000, 4000, 5000]

function getWaitingTime(tries: number) {
  const ms = waitingTimes[tries]
  if (typeof ms === 'number') return ms
  return waitingTimes[waitingTimes.length - 1]
}

export function createApiSocket<
  TTopic extends string,
  TEvent extends { topic: TTopic; payload: unknown },
>(createWebSocket: () => WebSocket): ApiSocket<TTopic, TEvent> {
  const apiSocket: ApiSocket<TTopic, TEvent> = {
    instance: null,
    subscriptions: new Set(),
    get ready() {
      return this.instance?.readyState === WebSocket.OPEN
    },
    get connecting() {
      return this.instance?.readyState === WebSocket.CONNECTING
    },
    get closed() {
      if (!this.instance) return true
      return this.instance.readyState === WebSocket.CLOSED
    },
    reconnectTries: 0,
    async checkConnection() {
      if (this.closed) {
        this.reconnect()
        this.reconnectTries += 1
      } else if (this.ready) {
        this.reconnectTries = 0
      }

      await sleep(getWaitingTime(this.reconnectTries))
      this.checkConnection()
    },
    reconnect() {
      this.instance?.close()
      this.instance = createWebSocket()

      this.instance.addEventListener('message', (event) => {
        const { topic, payload } = JSON.parse(event.data)

        this.subscriptions.forEach((subscription) => {
          if (subscription.topic !== topic) return
          subscription.handler(payload)
        })
      })
    },
    send(data) {
      if (this.ready) this.instance!.send(JSON.stringify(data))
      else sleep(500).then(() => this.send(data))
    },
    subscribe(topic, handler) {
      const subscription: SocketSubscription = { topic, handler }
      this.subscriptions.add(subscription)
      return () => this.subscriptions.delete(subscription)
    },
    subscriptionFactory: createFactory(
      <T extends TTopic>(options: { topic: T; initialActive?: boolean }) => {
        const pause = createEvent()
        const unpause = createEvent()
        const reset = createEvent()

        const $active = createStore(options.initialActive ?? true)
          .on(pause, () => false)
          .on(unpause, () => true)
          .reset(reset)

        type Payload = Extract<TEvent, { topic: T }>['payload']
        const receivedData = createEvent<Payload>()

        const receivedDataFiltered = sample({
          source: receivedData,
          filter: $active,
        })

        apiSocket.subscribe(options.topic, receivedData)

        return {
          pause,
          unpause,
          reset,
          receivedData: receivedDataFiltered,
        }
      },
    ),
  }

  apiSocket.checkConnection()

  return apiSocket
}
