import { Unsubscribable } from '@trpc/server/observable'
import { createFactory } from '@withease/factories'
import { attach, createEvent, createStore, sample } from 'effector'
import { readonly } from 'patronum'

interface Options<I, O> {
  subscription: {
    subscribe: (
      input: I,
      options: {
        onData?: (data: O) => void
      },
    ) => Unsubscribable
  }
}

export const createSubscription = createFactory(
  <I, O>(options: Options<I, O>) => {
    const $subscription = createStore<Unsubscribable | null>(null)

    const subscribe = createEvent<I>()
    const unsubscribe = createEvent()

    const receivedData = createEvent<O>()

    const unsubscribeFx = attach({
      source: $subscription,
      effect(subscription) {
        return subscription?.unsubscribe()
      },
    })

    const subscribeFx = attach({
      source: $subscription,
      async effect(subscription, input: I) {
        if (subscription) {
          // Unsubscribe from previous subscription
          await unsubscribeFx()
        }

        return options.subscription.subscribe(input, {
          onData: (payload) => receivedData(payload),
        })
      },
    })

    $subscription
      .on(subscribeFx.doneData, (_, subscription) => subscription)
      .on(unsubscribeFx.done, () => null)

    sample({
      source: subscribe,
      target: subscribeFx,
    })

    sample({
      source: unsubscribe,
      target: unsubscribeFx,
    })

    return {
      subscribe,
      unsubscribe,
      receivedData: readonly(receivedData),
    }
  },
)
