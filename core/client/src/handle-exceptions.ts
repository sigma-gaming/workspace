import { RouteException } from '@core/exceptions'
import { Form } from '@core/forms'
import { Mutation } from '@farfetched/core'
import { NotificationData } from '@mantine/notifications'
import { sample } from 'effector'
import { createExceptionEvents } from './create-exception-events'
import { $$notifications } from './notifications'

export function handleExceptions(
  mutation: Mutation<any, any, RouteException<unknown>>,
  targets: {
    form?: Form<any, any, any>
    message?: (message: string) => NotificationData
    otherMessage?: (exception: RouteException<unknown>) => NotificationData
  },
) {
  const { form, message, otherMessage } = targets
  const receivedException = createExceptionEvents(mutation)

  if (form) {
    sample({
      source: receivedException.formErrors,
      target: form.setErrors,
    })
  }

  if (message) {
    sample({
      source: receivedException.badRequestMessage,
      fn: message,
      target: $$notifications.show,
    })
  }

  if (otherMessage) {
    sample({
      source: receivedException.other,
      fn: otherMessage,
      target: $$notifications.show,
    })
  }
}
