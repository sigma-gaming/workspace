import { $$notifications } from '@core/client'
import { createField, createForm } from '@core/forms'
import { noop } from '@core/utils'
import { createMutation, createQuery } from '@farfetched/core'
import { NotificationData } from '@mantine/notifications'
import { sample } from 'effector'
import { z } from 'zod'
import { routes } from '../../routing'
import { controlApi } from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/effects'

const getStateQuery = createQuery({
  name: 'maintenance/get',
  effect: createApiEffect('query', controlApi.maintenance.getState.$get),
})

const updateStateMutation = createMutation({
  name: 'maintenance/update',
  handler: createApiEffect('json', controlApi.maintenance.updateState.$post),
})

const $loading = getStateQuery.$pending
const $submitting = updateStateMutation.$pending

const fields = {
  maintenanceEnabled: createField({
    emptyValue: false,
  }),
  backgroundJobsEnabled: createField({
    emptyValue: true,
  }),
}

const form = createForm({
  fields,
  schema: z.object({
    maintenanceEnabled: z.boolean(),
    backgroundJobsEnabled: z.boolean(),
  }),
})

sample({
  source: getStateQuery.finished.success,
  fn: ({ result }) => ({
    maintenanceEnabled: result.maintenanceEnabled,
    backgroundJobsEnabled: result.backgroundJobsEnabled,
  }),
  target: form.initialize,
})

sample({
  source: form.submitted,
  fn: ({ maintenanceEnabled, backgroundJobsEnabled }) => ({
    maintenanceEnabled,
    backgroundJobsEnabled,
  }),
  target: updateStateMutation.start,
})

sample({
  clock: routes.maintenance.opened,
  fn: noop,
  target: getStateQuery.start,
})

sample({
  source: updateStateMutation.finished.success,
  fn: (): NotificationData => ({
    title: 'Успех',
    message: 'Настройки успешно обновлены',
  }),
  target: $$notifications.show,
})

export const $$maintenancePage = {
  fields,
  form,
  $submitting,
  $loading,
}
