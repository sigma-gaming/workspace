import { ChatMessageType } from '@dbs/games-schema'
import { getUserInitials } from '@games/model'
import { Avatar } from '@libs/ui'
import { Button, Text, Title } from '@mantine/core'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useUnit } from 'effector-react'
import { UIEventHandler, useEffect, useRef } from 'react'
import { $$chatWidget } from './model'

export const Chat = () => {
  const text = useUnit($$chatWidget.fields.text.$value)
  const updateText = useUnit($$chatWidget.fields.text.update)
  const submit = useUnit($$chatWidget.form.submit)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="flex flex-col h-full">
      <Title order={3}>Чат</Title>
      <MessageList />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        className={clsx(
          'relative h-[142px] px-4 py-3 bg-[#1B1C2F] cursor-text transition-colors',
          'border rounded-2xl border-[#1B1C2E]',
          'focus-within:border-[color:var(--mantine-color-input-border-focus)]',
        )}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            textareaRef.current?.focus()
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <textarea
          ref={textareaRef}
          className={clsx(
            'w-full bg-transparent resize-none outline-none scrollbar-hide',
            'text-[color:var(--mantine-color-text)] placeholder-[color:var(--mantine-color-placeholder)]',
          )}
          value={text}
          onChange={(event) => updateText(event.target.value)}
          spellCheck={false}
          rows={3}
          placeholder="Введите сообщение..."
        />
        <Button
          className="absolute bottom-3 right-4"
          radius={12}
          size="sm"
          type="submit"
          disabled={text.length === 0}
        >
          Отправить
        </Button>
      </form>
    </div>
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
      className="flex-1 overflow-auto scrollbar-hide my-2 flex flex-col gap-2 rounded-2xl"
      onScroll={handleScroll}
    >
      {messages.map((message) => {
        const initials = getUserInitials(message.senderName)

        return (
          <div
            key={message.id}
            className="flex gap-3 p-3 pr-4 bg-[#1B1C2F] rounded-2xl"
            data-chat-message={true}
          >
            {message.type === ChatMessageType.UserMessage ? (
              <Avatar
                src={message.senderImage}
                alt={`Аватар ${message.senderName}`}
                fallback={initials}
                size={32}
              />
            ) : (
              <Avatar src={null} alt="Аватар системы" fallback="S" size={32} />
            )}
            <div className="flex flex-col gap-1 mt-1 font-interface">
              <div className="flex gap-2">
                <Text
                  className="cursor-default font-interface truncate max-w-[150px]"
                  c="#7D7E9C"
                  fw={500}
                  lh={1}
                  size="sm"
                >
                  {message.type === ChatMessageType.UserMessage
                    ? message.senderName
                    : 'Система'}
                </Text>
                <Text lh={1} size="sm" c="#4F506F">
                  {dayjs(message.createdAt).format('HH:mm')}
                </Text>
              </div>
              <Text className="break-words" lh="xs" size="sm">
                {message.text}
              </Text>
            </div>
          </div>
        )
      })}
    </div>
  )
}
