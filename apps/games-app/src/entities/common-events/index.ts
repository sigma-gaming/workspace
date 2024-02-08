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

const initialize = createEvent()
const reset = createEvent()

const subscribeFx = createEffect(() => {
  return gamesApi.events.subscription.subscribe(undefined, {
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
  clock: initialize,
  target: subscribeFx,
})

sample({
  clock: reset,
  target: unsubscribeFx,
})

export const $$commonEvents = {
  initialize,
  reset,
}
