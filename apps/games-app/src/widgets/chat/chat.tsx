import { Button, Card, TextInput, Title } from '@mantine/core'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { UIEventHandler, useEffect, useRef } from 'react'
import { $$chatWidget } from './model'
import css from './style.module.css'

export const Chat = () => {
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
      <MessageList />
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

const MessageList = () => {
  const messages = useUnit($$chatWidget.$messages)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousMessagesCount = useRef(0)
  const messagesCount = useRef(0)
  const stickyBottom = useRef(true)
  const initializedRef = useRef(false)

  const autoscroll = () => {
    const container = containerRef.current
    if (!container) return

    const lastMessage = container.querySelector(
      '[data-chat-message]:last-child',
    )
    if (!lastMessage) return

    if (!initializedRef.current) {
      lastMessage.scrollIntoView()
      initializedRef.current = true
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = container
    const lastMessageHeight = lastMessage.clientHeight

    const wasAtBottom =
      Math.abs(scrollHeight - scrollTop - clientHeight - lastMessageHeight) <=
      10

    if (wasAtBottom) {
      lastMessage.scrollIntoView()
    }
  }

  useEffect(() => {
    autoscroll()
  }, [messages.length])

  useEffect(() => {
    window.addEventListener('resize', autoscroll)
    return () => window.removeEventListener('resize', autoscroll)
  })

  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const scrolledToBottom = scrollHeight - scrollTop === clientHeight
    if (messagesCount.current !== previousMessagesCount.current) return
    stickyBottom.current = scrolledToBottom
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto my-2"
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <div key={message.chatMessage.id} data-chat-message={true}>
          {message.user?.profile.name}: {message.chatMessage.text}
        </div>
      ))}
      {/* <div ref={bottomRef} /> */}
    </div>
  )
}
