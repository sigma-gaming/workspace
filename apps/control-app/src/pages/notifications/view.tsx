import { Button, Card, LoadingOverlay, TextInput, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $$notificationsPage } from './model'

export const NotificationsPageView = () => {
  const title = useUnit($$notificationsPage.fields.title.$value)
  const updateTitle = useUnit($$notificationsPage.fields.title.update)
  const message = useUnit($$notificationsPage.fields.message.$value)
  const updateMessage = useUnit($$notificationsPage.fields.message.update)
  const submitting = useUnit($$notificationsPage.$submitting)
  const submit = useUnit($$notificationsPage.form.submit)
  const errors = useUnit($$notificationsPage.form.$errors)

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

      <TextInput
        label="Заголовок"
        placeholder="Введите заголовок уведомления"
        value={title}
        onChange={(event) => updateTitle(event.target.value)}
        error={errors.title[0]}
      />

      <TextInput
        label="Текст"
        placeholder="Введите текст уведомления"
        value={message}
        onChange={(event) => updateMessage(event.target.value)}
        error={errors.message[0]}
      />

      <Button type="submit" disabled={submitting} fullWidth={true}>
        Отправить уведомление
      </Button>
    </Card>
  )
}
