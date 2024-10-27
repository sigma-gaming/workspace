import { $$notifications } from '@core/client'
import { subscriptionFactory } from '@core/io-client'
import { NotificationSelect } from '@dbs/games-schema'
import { createQuery } from '@farfetched/core'
import { mapColor } from '@games/model'
import { invoke } from '@withease/factories'
import { createEffect, createEvent, sample } from 'effector'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const initialize = createEvent()
const reset = createEvent()

const getActualQuery = createQuery({
  name: 'notifications/getActual',
  effect: createApiEffect('query', gamesApi.notifications.getActual.$get),
})

const { receivedData: notificationReceived } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'notification' })
})

sample({
  source: notificationReceived,
  fn: (payload) => ({
    title: payload.title,
    message: payload.message,
    color: mapColor(payload.kind),
    autoClose: payload.autoClose ? payload.autoCloseMs : false,
    withCloseButton: payload.withCloseButton,
  }),
  target: $$notifications.show,
})

sample({
  clock: notificationReceived,
  fn: (payload) => payload.id,
  target: createEffect((id: string) => {
    const shown = localStorage.getItem('notifications/shown')?.split(',') ?? []
    localStorage.setItem('notifications/shown', shown.concat(id).join(','))
  }),
})

sample({
  clock: initialize,
  target: getActualQuery.start,
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
  target: getActualQuery.reset,
})

export const $$notificationEvents = {
  initialize,
  reset,
}
