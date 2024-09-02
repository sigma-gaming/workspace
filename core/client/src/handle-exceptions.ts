import { RouteException, TooManyRequestsException } from '@core/exceptions'
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
    notAuthenticatedMessage?: () => NotificationData
    otherMessage?: (exception: RouteException<unknown>) => NotificationData
    tooManyRequestsMessage?: (
      exception: TooManyRequestsException,
    ) => NotificationData
  } = {},
) {
  const {
    form,
    message = (message) => ({
      color: 'red',
      title: 'Произошла ошибка',
      message,
    }),
    notAuthenticatedMessage = () => ({
      color: 'red',
      title: 'Вы не авторизованы',
      message: 'Пожалуйста, авторизуйтесь',
    }),
    tooManyRequestsMessage = () => ({
      color: 'red',
      title: 'Слишком много запросов',
      message: 'Попробуйте через несколько минут',
    }),
    otherMessage = () => ({
      color: 'red',
      title: 'Что-то пошло не так',
      message: 'Попробуйте снова через пару минут',
    }),
  } = targets

  const receivedException = createExceptionEvents(mutation)

  if (form) {
    sample({
      source: receivedException.formErrors,
      target: form.setErrors,
    })
  }

  sample({
    source: receivedException.badRequestMessage,
    fn: message,
    target: $$notifications.show,
  })

  sample({
    source: receivedException.notAuthenticated,
    fn: notAuthenticatedMessage,
    target: $$notifications.show,
  })

  sample({
    source: receivedException.tooManyRequests,
    fn: tooManyRequestsMessage,
    target: $$notifications.show,
  })

  sample({
    source: receivedException.other,
    fn: otherMessage,
    target: $$notifications.show,
  })
}
