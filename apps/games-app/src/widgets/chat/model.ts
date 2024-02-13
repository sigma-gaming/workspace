import { ChatMessageAttachment } from '@games/db-schema'
import {
  ChatMessageDetailed,
  ChatMessageUser,
  ChatValidation,
} from '@games/model'
import { createField, createForm } from '@libs/forms'
import { invoke } from '@withease/factories'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { gamesApi } from '../../shared/api/games'
import { createSubscription } from '../../shared/lib/trpc/subscription'

const initialize = createEvent()
const reset = createEvent()

const getActualMessagesFx = createEffect(gamesApi.chat.getActualMessages.query)
const sendMessageFx = createEffect(gamesApi.chat.sendMessage.mutate)

const {
  subscribe: subscribeToMessages,
  unsubscribe: unsubscribeFromMessages,
  receivedData: detailedMessageReceived,
} = invoke(() =>
  createSubscription({
    subscription: gamesApi.chat.subscription,
  }),
)

const fields = {
  text: createField({
    emptyValue: '',
  }),
  attachments: createField<ChatMessageAttachment[]>({
    emptyValue: [],
  }),
}

export const form = createForm({
  fields,
  schema: ChatValidation.MessagePayloadSchema,
})

const $messages = createStore<ChatMessageDetailed[]>([]).reset(reset)

const $messageIds = $messages.map(
  (messages) => new Set(messages.map((message) => message.chatMessage.id)),
)

const $usersById = $messages.map((messages) => {
  const usersById = new Map<string, ChatMessageUser>()

  for (const message of messages) {
    if (!message.user) continue
    usersById.set(message.user.id, message.user)
  }

  return usersById
})

sample({
  clock: initialize,
  target: [getActualMessagesFx, subscribeToMessages],
})

sample({
  clock: getActualMessagesFx.doneData,
  source: { messages: $messages, ids: $messageIds },
  fn: ({ messages, ids }, actualMessages) => {
    const newMessages = actualMessages.filter(
      (message) => !ids.has(message.chatMessage.id),
    )

    const updatedMessages = messages.concat(newMessages).sort((a, b) => {
      const dateA = new Date(a.chatMessage.createdAt).getTime()
      const dateB = new Date(b.chatMessage.createdAt).getTime()
      return dateA - dateB
    })

    return updatedMessages
  },
  target: $messages,
})

sample({
  clock: detailedMessageReceived,
  source: { messages: $messages, ids: $messageIds },
  filter: ({ ids }, message) => !ids.has(message.chatMessage.id),
  fn: ({ messages }, message) => messages.concat(message),
  target: $messages,
})

sample({
  clock: form.submitted,
  target: sendMessageFx,
})

sample({
  clock: reset,
  target: [unsubscribeFromMessages],
})

export const $$chatWidget = {
  initialize,
  reset,
  form,
  fields,
  $messages,
  $messageIds,
  $usersById,
}
