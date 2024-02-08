import { NotificationKind } from '@libs/games-db-schema'
import { mapColor } from '@libs/games-model'
import {
  Button,
  Card,
  LoadingOverlay,
  NumberInput,
  rem,
  Select,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconCircleFilled } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { $$notificationsPage } from './model'

const { form, fields } = $$notificationsPage

export const NotificationsPageView = () => {
  const title = useUnit(fields.title.$value)
  const updateTitle = useUnit(fields.title.update)
  const message = useUnit(fields.message.$value)
  const updateMessage = useUnit(fields.message.update)
  const kind = useUnit(fields.kind.$value)
  const updateKind = useUnit(fields.kind.update)
  const autoCloseSeconds = useUnit(fields.autoCloseSeconds.$value)
  const updateAutoCloseSeconds = useUnit(fields.autoCloseSeconds.update)
  const expirationMinutes = useUnit(fields.expirationMinutes.$value)
  const updateExpirationMinutes = useUnit(fields.expirationMinutes.update)
  const withCloseButton = useUnit(fields.withCloseButton.$value)
  const updateWithCloseButton = useUnit(fields.withCloseButton.update)

  const submit = useUnit(form.submit)
  const errors = useUnit(form.$errors)
  const submitting = useUnit($$notificationsPage.$submitting)

  const colorOptions: Array<{ label: string; value: NotificationKind }> = [
    { label: 'Информация', value: NotificationKind.Info },
    { label: 'Успех', value: NotificationKind.Success },
    { label: 'Предупреждение', value: NotificationKind.Warning },
    { label: 'Ошибка', value: NotificationKind.Failure },
  ]

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

      <Title order={3}>Уведомления</Title>

      <TextInput
        label="Заголовок"
        placeholder="Введите заголовок"
        value={title}
        onChange={(event) => updateTitle(event.target.value)}
        error={errors.title[0]}
      />

      <TextInput
        label="Текст"
        placeholder="Введите текст"
        value={message}
        onChange={(event) => updateMessage(event.target.value)}
        error={errors.message[0]}
      />

      <Select
        label="Цвет"
        leftSection={
          <Text c={mapColor(kind) + '.7'}>
            <IconCircleFilled
              style={{ color: 'inherit', width: rem(16), height: rem(16) }}
            />
          </Text>
        }
        data={colorOptions}
        value={kind}
        onChange={(color) => updateKind(color as NotificationKind)}
        allowDeselect={false}
        error={errors.kind[0]}
      />

      <NumberInput
        label="Время до автоматического закрытия (секунды)"
        description="0 — не закрывать автоматически"
        value={autoCloseSeconds}
        onChange={(value) => updateAutoCloseSeconds(Number(value))}
        error={errors.autoCloseSeconds[0]}
        min={0}
        allowDecimal={false}
      />

      <Switch
        checked={withCloseButton}
        onChange={(event) => updateWithCloseButton(event.target.checked)}
        label="Кнопка закрытия"
        error={errors.withCloseButton[0]}
      />

      <NumberInput
        label="Время актуальности (минуты)"
        description="0 - будет показано только тем, кто онлайн в момент отправки"
        value={expirationMinutes}
        onChange={(value) => updateExpirationMinutes(Number(value))}
        error={errors.expirationMinutes[0]}
        min={0}
        allowDecimal={false}
      />

      <Button type="submit" disabled={submitting} fullWidth={true}>
        Отправить уведомление
      </Button>
    </Card>
  )
}
