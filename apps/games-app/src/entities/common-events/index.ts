import { Unsubscribable } from '@trpc/server/observable'
import {
  attach,
  createEffect,
  createEvent,
  createStore,
  sample,
} from 'effector'
import { $$maintenance } from '../../features/maintenance'
import { gamesApi } from '../../shared/api/games'

const subscribe = createEvent()
const unsubscribe = createEvent()

const subscribeFx = createEffect(() => {
  return gamesApi.events.common.subscribe(undefined, {
    onData(event) {
      if (event.name === 'started') {
        $$maintenance.activate()
      }
    },
  })
})

const $subscription = createStore<Unsubscribable | null>(null).on(
  subscribeFx.doneData,
  (_, subscription) => subscription,
)

const unsubscribeFx = attach({
  source: $subscription,
  effect(subscription) {
    return subscription?.unsubscribe()
  },
})

sample({
  clock: subscribe,
  target: subscribeFx,
})

sample({
  clock: unsubscribe,
  target: unsubscribeFx,
})

export const $$commonEvents = {
  subscribe,
  unsubscribe,
}
