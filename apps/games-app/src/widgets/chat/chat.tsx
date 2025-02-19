import { Avatar, Icons, useMedia } from '@core/ui'
import { getUserInitials } from '@games/model'
import { ActionIcon, Button, Skeleton } from '@mantine/core'
import clsx from 'clsx'
import { useUnit } from 'effector-react'
import { memo, UIEventHandler, useCallback, useEffect, useRef } from 'react'
import { $$session } from '../../entities/session'
import { ChatMessageType } from '../../shared/api/core'
import { useTimeAgo } from '../../shared/time'
import { $$chatWidget, ExtendedMessage } from './model'

export const Chat = () => {
  const loggedIn = useUnit($$session.$loggedIn)
  const text = useUnit($$chatWidget.fields.text.$value)
  const updateText = useUnit($$chatWidget.fields.text.update)
  const submit = useUnit($$chatWidget.form.submit)
  const sendingMessage = useUnit($$chatWidget.$sendingMessage)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isMobile = useMedia({ to: 'md' })

  const disabled = !loggedIn

  const handleSubmit = () => {
    submit()
    if (isMobile) textareaRef.current?.blur()
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-2xl font-medium m-0 md:mb-2">Чат</h2>
      <MessageList />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        className={clsx(
          'relative px-4 py-3 bg-[#1B1C2F] transition-colors',
          'border rounded-2xl border-[#1B1C2E]',
          'focus-within:outline outline-2 outline-[color:var(--mantine-color-input-border-focus)]',
          !isMobile && 'h-[142px]',
          isMobile && 'flex gap-4 items-center',
          disabled ? 'select-none cursor-not-allowed' : 'cursor-text',
        )}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            textareaRef.current?.focus()
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            handleSubmit()
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <textarea
          ref={textareaRef}
          className={clsx(
            'w-full bg-transparent resize-none outline-none scrollbar-hide',
            'text-[color:var(--mantine-color-text)] placeholder-[color:var(--mantine-color-placeholder)]',
            'disabled:opacity-75 disabled:pointer-events-none',
          )}
          value={text}
          onChange={(event) => updateText(event.target.value)}
          spellCheck={false}
          rows={isMobile ? 1 : 3}
          wrap={isMobile ? 'off' : 'soft'}
          placeholder={
            loggedIn
              ? 'Введите сообщение...'
              : 'Для отправки сообщений нужно авторизоваться'
          }
          disabled={disabled}
        />
        {isMobile ? (
          <ActionIcon
            size={36}
            type="submit"
            disabled={text.length === 0}
            loading={sendingMessage}
          >
            <Icons.Send className="w-6 h-6" />
          </ActionIcon>
        ) : (
          <Button
            className="absolute bottom-3 right-4"
            radius={12}
            size="sm"
            type="submit"
            disabled={text.length === 0 || !loggedIn}
            loading={sendingMessage}
          >
            Отправить
          </Button>
        )}
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
  const loadingMessages = useUnit($$chatWidget.$loadingMessages)

  const autoscroll = useCallback(() => {
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
  }, [])

  useEffect(() => {
    autoscroll()
  }, [autoscroll, messages.length])

  useEffect(() => {
    window.addEventListener('resize', autoscroll)
    return () => window.removeEventListener('resize', autoscroll)
  }, [autoscroll])

  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const scrolledToBottom = scrollHeight - scrollTop === clientHeight
    if (messagesCount.current !== previousMessagesCount.current) return
    stickyBottom.current = scrolledToBottom
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'flex-1 scrollbar-hide flex gap-2 rounded-2xl',
        loadingMessages
          ? 'overflow-hidden flex-col-reverse'
          : 'overflow-auto flex-col',
      )}
      onScroll={handleScroll}
      data-scroll-lock-scrollable
    >
      {loadingMessages
        ? Array.from({ length: 10 }).map((_, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <MessageSkeleton key={`skeleton-${index}`} />
          })
        : messages.map((message) => {
            return <Message key={message.id} message={message} />
          })}
    </div>
  )
}

const FormattedTime = memo(({ date }: { date: string }) => {
  return <span>{useTimeAgo(date)}</span>
})

const AVATAR_SIZE = 32

const Message = memo(({ message }: { message: ExtendedMessage }) => {
  const initials = getUserInitials(message.senderName)

  return (
    <div
      key={message.id}
      className={clsx(
        'flex gap-3 p-3 pr-4 bg-[#1B1C2F] rounded-2xl',
        message.temporary && 'opacity-50',
      )}
      data-chat-message={true}
    >
      {message.type === ChatMessageType.UserMessage ? (
        <Avatar
          src={message.senderImage}
          alt={`Аватар ${message.senderName}`}
          fallback={initials}
          size={AVATAR_SIZE}
        />
      ) : (
        <Avatar
          src={null}
          alt="Аватар системы"
          fallback="S"
          size={AVATAR_SIZE}
        />
      )}
      <div
        className="flex flex-col gap-1 mt-1 max-w-[calc(100%-44px)]"
        style={{ maxWidth: `calc(100% - ${AVATAR_SIZE + 12}px)` }}
      >
        <div className="flex items-center gap-2">
          <p className="cursor-default truncate max-w-[150px] text-[#7D7E9C] font-medium text-sm leading-none">
            {message.type === ChatMessageType.UserMessage
              ? message.senderName
              : 'Система'}
          </p>
          <p className="text-xs leading-none text-[#4F506F] whitespace-nowrap">
            <FormattedTime date={message.createdAt} />
          </p>
        </div>
        <p className="break-words text-sm">{message.text}</p>
      </div>
    </div>
  )
})

const MessageSkeleton = memo(() => {
  const minHeight = 64 + Math.round(Math.random() * 32)

  return (
    <Skeleton
      className="flex gap-3 p-3 pr-4 rounded-2xl"
      style={{ minHeight }}
    />
  )
})
