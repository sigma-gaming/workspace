import { createFactory } from '@withease/factories'
import { createEvent, createStore, Event, sample } from 'effector'
import { Socket } from 'socket.io-client'

type EventsMap = {
  [key: string]: (...args: any[]) => void
}

type Subscription<T> = {
  pause: Event<void>
  unpause: Event<void>
  reset: Event<void>
  receivedData: Event<T>
}

type Payload<T extends EventsMap, K extends keyof T> = Parameters<
  T[K]
>[0] extends void
  ? void
  : Parameters<T[K]>[0]

export const subscriptionFactory = createFactory(
  <
    S extends Socket<EventsMap, EventsMap>,
    T extends S extends Socket<infer T, EventsMap> ? T : never,
    K extends Exclude<keyof T, number | symbol>,
  >(options: {
    ws: S
    event: K
    initialActive?: boolean
  }): Subscription<Payload<T, K>> => {
    const pause = createEvent()
    const unpause = createEvent()
    const reset = createEvent()

    const $active = createStore(options.initialActive ?? true)
      .on(pause, () => false)
      .on(unpause, () => true)
      .reset(reset)

    const receivedData = createEvent<Payload<T, K>>()

    const receivedDataFiltered = sample({
      source: receivedData,
      filter: $active,
    })

    const listener = (payload: Payload<T, K>) => {
      receivedData(payload)
    }

    options.ws.on(options.event, listener as any)

    return {
      pause,
      unpause,
      reset,
      receivedData: receivedDataFiltered,
    }
  },
)
