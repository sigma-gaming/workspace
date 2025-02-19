import { HubConnection } from '@microsoft/signalr'
import { createFactory } from '@withease/factories'
import { createEvent, createStore, Event, sample } from 'effector'

type AbstractEvent<TName extends string> = {
  name: TName
  payload: unknown
}

type Subscription<T> = {
  pause: Event<void>
  unpause: Event<void>
  reset: Event<void>
  receivedData: Event<T>
}

type Payload<
  TAnyName extends string,
  TEvent extends AbstractEvent<TAnyName>,
  TName extends TAnyName,
> = TEvent extends AbstractEvent<TName> ? TEvent['payload'] : never

export function createSubscriptionFactory<
  TName extends string,
  TEvent extends AbstractEvent<TName>,
>(connection: HubConnection) {
  return createFactory(
    <N extends TName>(name: N): Subscription<Payload<TName, TEvent, N>> => {
      const pause = createEvent()
      const unpause = createEvent()
      const reset = createEvent()

      const $active = createStore(true)
        .on(pause, () => false)
        .on(unpause, () => true)
        .reset(reset)

      const receivedData = createEvent<Payload<TName, TEvent, N>>()

      const receivedDataFiltered = sample({
        source: receivedData,
        filter: $active,
      })

      const listener = (payload: Payload<TName, TEvent, N>) => {
        receivedData(payload)
      }

      connection.on(name, listener)

      return {
        pause,
        unpause,
        reset,
        receivedData: receivedDataFiltered,
      }
    },
  )
}
