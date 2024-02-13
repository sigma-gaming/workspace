import { Button, Card, TextInput, Title } from '@mantine/core'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { $$chatWidget } from './model'
import css from './style.module.css'

export const Chat = () => {
  const messages = useUnit($$chatWidget.$messages)

  const text = useUnit($$chatWidget.fields.text.$value)
  const updateText = useUnit($$chatWidget.fields.text.update)
  const submit = useUnit($$chatWidget.form.submit)

  return (
    <Card
      className={clsx(
        css.container,
        'justify-self-stretch hidden xl:flex flex-col justify-between md:w-72 mx-4 md:mx-0 rounded-r-none',
      )}
    >
      <Title order={3}>Чат</Title>
      <div className="flex-1 overflow-auto my-2">
        {messages.map((message) => (
          <div key={message.chatMessage.id}>
            {message.user?.profile.name}: {message.chatMessage.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <TextInput
          value={text}
          onChange={(event) => updateText(event.target.value)}
          placeholder="Введите текст сообщения"
        />
        <Button className="mt-2" fullWidth={true} type="submit">
          Отправить
        </Button>
      </form>
    </Card>
  )
}
