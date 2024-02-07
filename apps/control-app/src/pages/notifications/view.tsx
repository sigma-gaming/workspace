import { mapColor, NotificationColor } from '@libs/games-model'
import {
  Button,
  Card,
  LoadingOverlay,
  NumberInput,
  rem,
  Select,
  Space,
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
  const color = useUnit(fields.color.$value)
  const updateColor = useUnit(fields.color.update)
  const autoClose = useUnit(fields.autoClose.$value)
  const updateAutoClose = useUnit(fields.autoClose.update)
  const withCloseButton = useUnit(fields.withCloseButton.$value)
  const updateWithCloseButton = useUnit(fields.withCloseButton.update)

  const submit = useUnit(form.submit)
  const errors = useUnit(form.$errors)
  const submitting = useUnit($$notificationsPage.$submitting)

  const colorOptions: Array<{ label: string; value: NotificationColor }> = [
    { label: 'Информация', value: 'info' },
    { label: 'Успех', value: 'success' },
    { label: 'Предупреждение', value: 'warning' },
    { label: 'Ошибка', value: 'error' },
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
          <Text c={mapColor(color) + '.7'}>
            <IconCircleFilled
              style={{ color: 'inherit', width: rem(16), height: rem(16) }}
            />
          </Text>
        }
        data={colorOptions}
        value={color}
        onChange={(color) => updateColor(color as NotificationColor)}
        allowDeselect={false}
        error={errors.color[0]}
      />

      <NumberInput
        label="Секунды до закрытия"
        description="0 — не закрывать автоматически"
        value={autoClose}
        onChange={(value) => updateAutoClose(Number(value))}
        error={errors.autoClose[0]}
        min={0}
        allowDecimal={false}
      />

      <Switch
        checked={withCloseButton}
        onChange={(event) => updateWithCloseButton(event.target.checked)}
        label="Кнопка закрытия"
        error={errors.withCloseButton[0]}
      />

      <Button type="submit" disabled={submitting} fullWidth={true}>
        Отправить уведомление
      </Button>
    </Card>
  )
}
