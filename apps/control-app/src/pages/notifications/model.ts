import { createMutation } from '@farfetched/core'
import { createField, createForm } from '@libs/forms'
import { NotificationEventPayload } from '@libs/games-redis'
import { NotificationData } from '@mantine/notifications'
import { sample } from 'effector'
import { z } from 'zod'
import { $$notifications } from '../../entities/notifications'
import { controlApi } from '../../shared/api/control'

const sendNotificationMutation = createMutation({
  name: 'notifications/send',
  handler: controlApi.notifications.send.mutate,
})

const $submitting = sendNotificationMutation.$pending

type Color = NonNullable<NotificationEventPayload['content']['color']>

const fields = {
  title: createField({ emptyValue: '' }),
  message: createField({ emptyValue: '' }),
  color: createField<Color>({ emptyValue: 'info' }),
  autoClose: createField({ emptyValue: 0 }),
  withCloseButton: createField({ emptyValue: true }),
}

const form = createForm({
  fields,
  schema: z.object({
    title: z.string().min(1, 'Заголовок не может быть пустым'),
    message: z.string().min(1, 'Сообщение не может быть пустым'),
    color: z.enum(['info', 'success', 'warning', 'error']),
    autoClose: z.number().transform((value) => (value === 0 ? false : value)),
    withCloseButton: z.boolean(),
  }),
})

sample({
  source: form.submitted,
  fn: (content): NotificationEventPayload => ({
    target: { type: 'global' },
    content,
  }),
  target: sendNotificationMutation.start,
})

sample({
  source: sendNotificationMutation.finished.success,
  fn: (): NotificationData => ({
    title: 'Уведомление отправлено',
    message: '',
  }),
  target: $$notifications.show,
})

export const $$notificationsPage = {
  fields,
  form,
  $submitting,
}
