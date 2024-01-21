import { NotificationData, notifications } from '@mantine/notifications'
import { createEffect, createEvent, sample } from 'effector'

function options(data: NotificationData) {
  return data
}

const showFx = createEffect((data: NotificationData) => {
  notifications.show(data)
})

export const show = createEvent<NotificationData>()

sample({
  source: show,
  target: showFx,
})

export const $$notifications = {
  options,
  show,
}
