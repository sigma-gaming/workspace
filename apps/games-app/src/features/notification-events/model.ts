import { $$notifications } from '@core/client'
import { createQuery } from '@farfetched/core'
import { invoke } from '@withease/factories'
import { createEffect, createEvent, sample } from 'effector'
import { getNotificationsActual, Notification } from '../../shared/api/core'
import { EventName } from '../../shared/api/core-ws'
import { $$coreWs } from '../../shared/api/core-ws/model'
import { createApiEffect } from '../../shared/api/effects'
import { mapColor } from './lib/map-color'

const initialize = createEvent()
const reset = createEvent()

const getActualQuery = createQuery({
  name: 'notifications/getActual',
  effect: createApiEffect(getNotificationsActual),
})

const { receivedData: notificationReceived } = invoke(() => {
  return $$coreWs.subscriptionFactory(EventName.NotificationCreated)
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
  target: createEffect((notifications: Notification[]) => {
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
