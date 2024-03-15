import { createQuery } from '@farfetched/core'
import { NotificationSelect } from '@games/db-schema'
import { mapColor } from '@games/model'
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

const initialize = createEvent()
const reset = createEvent()

const getActualQuery = createQuery({
  name: 'notifications/getActual',
  handler: gamesApi.notifications.getActual.query,
})

const $subscription = createStore<Unsubscribable | null>(null)

const subscribeFx = attach({
  source: $subscription,
  effect(subscription) {
    if (subscription) {
      // Unsubscribe from previous subscription
      subscription.unsubscribe()
    }

    return gamesApi.notifications.subscription.subscribe(undefined, {
      onData({
        id,
        title,
        message,
        kind,
        autoClose,
        autoCloseMs,
        withCloseButton,
      }) {
        $$notifications.show({
          title,
          message,
          color: mapColor(kind),
          autoClose: autoClose ? autoCloseMs : false,
          withCloseButton,
        })

        const shown =
          localStorage.getItem('notifications/shown')?.split(',') ?? []
        localStorage.setItem('notifications/shown', shown.concat(id).join(','))
      },
    })
  },
})

$subscription.on(subscribeFx.doneData, (_, subscription) => subscription)

const unsubscribeFx = attach({
  source: $subscription,
  effect(subscription) {
    return subscription?.unsubscribe()
  },
})

sample({
  clock: initialize,
  target: [getActualQuery.start, subscribeFx],
})

sample({
  clock: getActualQuery.finished.success,
  fn: ({ result }) => result,
  target: createEffect((notifications: NotificationSelect[]) => {
    const shown = localStorage.getItem('notifications/shown')?.split(',') ?? []

    notifications
      .filter(({ id }) => !shown.includes(id))
      .forEach($$notifications.show)

    const ids = notifications.map(({ id }) => id)

    localStorage.setItem('notifications/shown', ids.join(','))
  }),
})

sample({
  clock: reset,
  target: [getActualQuery.reset, unsubscribeFx],
})

export const $$notificationEvents = {
  initialize,
  reset,
}
