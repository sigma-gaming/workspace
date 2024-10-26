import { $$notifications } from '@core/client'
import { createField, createForm } from '@core/forms'
import { createMutation, createQuery } from '@farfetched/core'
import { NotificationData } from '@mantine/notifications'
import { sample } from 'effector'
import { z } from 'zod'
import { routes } from '../../routing'
import { controlApi } from '../../shared/api/control'
import { createProtectedApiEffect } from '../../shared/api/protected'

const getMaintenanceQuery = createQuery({
  name: 'maintenance/get',
  effect: createProtectedApiEffect('query', controlApi.maintenance.get.$get),
})

const updateMaintenanceMutation = createMutation({
  name: 'maintenance/update',
  handler: createProtectedApiEffect(
    'json',
    controlApi.maintenance.update.$post,
  ),
})

const $loading = getMaintenanceQuery.$pending
const $submitting = updateMaintenanceMutation.$pending

const fields = {
  maintenance: createField({
    emptyValue: false,
  }),
}

const form = createForm({
  fields,
  schema: z.object({
    maintenance: z.boolean(),
  }),
})

sample({
  source: getMaintenanceQuery.finished.success,
  fn: ({ result }) => ({ maintenance: result.maintenanceMode }),
  target: form.initialize,
})

sample({
  source: form.submitted,
  fn: ({ maintenance }) => ({ value: maintenance }),
  target: updateMaintenanceMutation.start,
})

sample({
  clock: routes.maintenance.opened,
  target: getMaintenanceQuery.start,
})

sample({
  source: updateMaintenanceMutation.finished.success,
  fn: ({ result }): NotificationData => ({
    title: 'Значение обновлено',
    message: result.maintenanceMode
      ? 'Режим технических работ включен'
      : 'Режим технических работ выключен',
  }),
  target: $$notifications.show,
})

export const $$maintenancePage = {
  fields,
  form,
  $submitting,
  $loading,
}
