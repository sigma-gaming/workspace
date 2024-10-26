import { $$notifications } from '@core/client'
import { createField, createForm } from '@core/forms'
import { NotificationInsert } from '@dbs/games-schema'
import { NotificationKind } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { NotificationData } from '@mantine/notifications'
import { sample } from 'effector'
import { z } from 'zod'
import { controlApi } from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/protected'

const sendNotificationMutation = createMutation({
  name: 'notifications/send',
  effect: createApiEffect('json', controlApi.notifications.send.$post),
})

const $submitting = sendNotificationMutation.$pending

const fields = {
  title: createField({ emptyValue: '' }),
  message: createField({ emptyValue: '' }),
  kind: createField<NotificationKind>({ emptyValue: NotificationKind.Info }),
  autoCloseSeconds: createField({ emptyValue: 0 }),
  withCloseButton: createField({ emptyValue: true }),
  expirationMinutes: createField({ emptyValue: 0 }),
}

const form = createForm({
  fields,
  schema: z.object({
    title: z.string().min(1, 'Заголовок не может быть пустым'),
    message: z.string().min(1, 'Текст не может быть пустым'),
    expirationMinutes: z.number(),
    kind: z.nativeEnum(NotificationKind),
    autoCloseSeconds: z.number(),
    withCloseButton: z.boolean(),
    userId: z.string().uuid().optional(),
  }),
})

sample({
  source: form.submitted,
  fn: ({
    autoCloseSeconds,
    expirationMinutes,
    ...rest
  }): NotificationInsert => ({
    ...rest,
    autoClose: autoCloseSeconds > 0,
    autoCloseMs: autoCloseSeconds * 1000,
    expiresAt: new Date(
      Date.now() + expirationMinutes * 60 * 1000,
    ).toISOString(),
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
