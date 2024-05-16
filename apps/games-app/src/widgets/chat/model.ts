import { ChatMessageAttachment, ChatMessageSelect } from '@dbs/games-schema'
import { ChatValidation } from '@games/model'
import { createField, createForm } from '@libs/forms'
import { invoke } from '@withease/factories'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { gamesApi } from '../../shared/api/games'
import { createSubscription } from '../../shared/lib/trpc/subscription'

const initialize = createEvent()
const reset = createEvent()

const getActualMessagesFx = createEffect(gamesApi.chat.getLastMessages.query)
const sendMessageFx = createEffect(gamesApi.chat.sendMessage.mutate)

const {
  subscribe: subscribeToMessages,
  unsubscribe: unsubscribeFromMessages,
  receivedData: messageReceived,
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

const $messages = createStore<ChatMessageSelect[]>([]).reset(reset)

const $messageIds = $messages.map(
  (messages) => new Set(messages.map((message) => message.id)),
)

sample({
  clock: initialize,
  target: [getActualMessagesFx, subscribeToMessages],
})

sample({
  clock: getActualMessagesFx.doneData,
  source: { messages: $messages, ids: $messageIds },
  fn: ({ messages, ids }, actualMessages) => {
    const newMessages = actualMessages.filter((message) => !ids.has(message.id))

    const updatedMessages = messages.concat(newMessages).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateA - dateB
    })

    return updatedMessages
  },
  target: $messages,
})

sample({
  clock: messageReceived,
  source: { messages: $messages, ids: $messageIds },
  filter: ({ ids }, message) => !ids.has(message.id),
  fn: ({ messages }, message) => messages.concat(message),
  target: $messages,
})

sample({
  clock: form.submitted,
  target: [sendMessageFx, form.empty],
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
}
