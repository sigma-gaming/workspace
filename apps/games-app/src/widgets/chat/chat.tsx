import { getUserInitials } from '@games/model'
import { Avatar } from '@libs/ui'
import { Button, Text, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { UIEventHandler, useEffect, useRef } from 'react'
import { $$chatWidget } from './model'

export const Chat = () => {
  const text = useUnit($$chatWidget.fields.text.$value)
  const updateText = useUnit($$chatWidget.fields.text.update)
  const submit = useUnit($$chatWidget.form.submit)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="fixed top-[80px] right-0 bottom-0 w-[320px] p-6 flex flex-col">
      <Title order={3}>Чат</Title>
      <MessageList />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        className="relative h-[142px] px-4 py-3 bg-[#1B1C2F] rounded-2xl cursor-text"
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
          className="w-full bg-transparent placeholder-[#4E4F6D] resize-none outline-none scrollbar-hide"
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
      {messages.map(({ chatMessage, user }) => {
        const initials = getUserInitials(user?.profile?.name)

        return (
          <div
            key={chatMessage.id}
            className="flex gap-3 p-3 pr-4 bg-[#1B1C2F] rounded-2xl"
            data-chat-message={true}
          >
            {user && (
              <Avatar
                src={user.profile.image}
                alt={`Аватар ${user.profile.name}`}
                fallback={initials}
                size={32}
              />
            )}
            <div className="flex flex-col gap-1 mt-1 font-interface">
              <Text
                className="cursor-default font-interface"
                c="#9494a5"
                fw={500}
                lh={1}
                size="sm"
              >
                {user?.profile.name ?? 'Система'}
              </Text>
              <Text className="break-words" c="#fcf8f9" lh="xs" size="sm">
                {chatMessage.text}
              </Text>
            </div>
          </div>
        )
      })}
    </div>
  )
}
