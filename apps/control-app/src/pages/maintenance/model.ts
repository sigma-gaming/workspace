import { createMutation, createQuery } from '@farfetched/core'
import { NotificationData } from '@mantine/notifications'
import { createEvent, createStore, sample } from 'effector'
import { $$notifications } from '../../entities/notifications'
import { routes } from '../../routing'
import { controlApi } from '../../shared/api/control'

const getMaintenanceQuery = createQuery({
  name: 'maintenance/get',
  handler: controlApi.settings.getMaintenance.query,
})

const updateMaintenanceMutation = createMutation({
  name: 'maintenance/update',
  handler: controlApi.settings.updateMaintenance.mutate,
})

const submit = createEvent<void>()
const maintenanceChanged = createEvent<boolean>()

const $loading = getMaintenanceQuery.$pending
const $submitting = updateMaintenanceMutation.$pending

const $maintenance = createStore(false)
  .on(
    getMaintenanceQuery.finished.success,
    (_, { result }) => result.maintenanceMode,
  )
  .on(maintenanceChanged, (_, value) => value)

sample({
  clock: routes.maintenance.opened,
  target: getMaintenanceQuery.start,
})

sample({
  clock: submit,
  source: $maintenance,
  fn: (value) => ({ value }),
  target: updateMaintenanceMutation.start,
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
  $maintenance,
  $submitting,
  $loading,
  submit,
  maintenanceChanged,
}
