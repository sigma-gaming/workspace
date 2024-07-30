import {
  Button,
  Card,
  LoadingOverlay,
  Skeleton,
  Switch,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$maintenancePage } from './model'

export const MaintenancePageView = () => {
  const maintenance = useUnit($$maintenancePage.fields.maintenance.$value)
  const updateMaintenance = useUnit($$maintenancePage.fields.maintenance.update)
  const loading = useUnit($$maintenancePage.$loading)
  const submitting = useUnit($$maintenancePage.$submitting)
  const submit = useUnit($$maintenancePage.form.submit)

  return (
    <Card
      component="form"
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      style={{ gap: 'var(--mantine-spacing-md)' }}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <LoadingOverlay visible={submitting} />

      <Title order={3}>Технические работы</Title>

      <Skeleton className="sm:w-fit" visible={loading}>
        <Switch
          checked={maintenance}
          onChange={(event) => updateMaintenance(event.target.checked)}
          label="Режим технических работ"
        />
      </Skeleton>

      <Skeleton className="sm:w-fit" visible={loading}>
        <Button type="submit" disabled={submitting} fullWidth={true}>
          Сохранить изменения
        </Button>
      </Skeleton>
    </Card>
  )
}
