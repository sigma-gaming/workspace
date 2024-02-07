import { mapColor } from '@libs/games-model'
import { Unsubscribable } from '@trpc/server/observable'
import {
  attach,
  createEffect,
  createEvent,
  createStore,
  sample,
} from 'effector'
import { $$notifications } from '../../entities/notifications'
import { gamesApi } from '../../shared/api/games'

const subscribe = createEvent()
const unsubscribe = createEvent()

const subscribeFx = createEffect(() => {
  return gamesApi.events.notifications.subscribe(undefined, {
    onData(content) {
      $$notifications.show({
        ...content,
        color: mapColor(content.color),
      })
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

export const $$notificationEvents = {
  subscribe,
  unsubscribe,
}
