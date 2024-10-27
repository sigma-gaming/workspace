import { handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { subscriptionFactory } from '@core/io-client'
import { ChatMessageAttachment, ChatMessageType } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { ChatMessageDetailed, ChatValidation } from '@games/model'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { v4 as uuid } from 'uuid'
import { $$profile } from '../../entities/profile'
import { $$user } from '../../entities/user'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'
import { createApiEffect } from '../../shared/api/effects'

const initialize = createEvent()
const reset = createEvent()

const getLastMessagesFx = createApiEffect(
  'query',
  gamesApi.chat.getLastMessages.$get,
)

const sendMessageMutation = createMutation({
  name: 'chat/sendMessage',
  effect: createApiEffect('json', gamesApi.chat.sendMessage.$post),
})

const $loadingMessages = createStore(true)
  .on(getLastMessagesFx.done, () => false)
  .reset(reset)

const { receivedData: messageReceived } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'chat/message' })
})

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
  schema: ChatValidation.MessagePayloadSchema.omit({ trackingId: true }),
})

handleExceptions(sendMessageMutation, { form })

export type ExtendedMessage = ChatMessageDetailed & {
  temporary?: boolean
}

const $sendingMessage = sendMessageMutation.$pending
const $messages = createStore<ExtendedMessage[]>([]).reset(reset)

sample({
  clock: initialize,
  target: getLastMessagesFx,
})

sample({
  clock: getLastMessagesFx.doneData,
  source: $messages,
  fn: (messages, receivedMessages) => {
    const ids = messages.map((message) => message.id)

    const newMessages = receivedMessages.filter(
      (message) => !ids.includes(message.id),
    )

    return messages.concat(newMessages).sort((a, b) => a.id - b.id)
  },
  target: $messages,
})

sample({
  clock: messageReceived,
  source: $messages,
  fn: (messages, receivedMessage) => {
    const hasTemporaryMessage = messages.some(
      (message) => message.trackingId === receivedMessage.trackingId,
    )

    if (!hasTemporaryMessage) {
      return messages.concat(receivedMessage)
    }

    return messages.map((message) => {
      if (message.trackingId !== receivedMessage.trackingId) {
        return message
      }

      return receivedMessage
    })
  },
  target: $messages,
})

const submitted = sample({
  source: form.submitted,
  fn: (payload) => ({ ...payload, trackingId: uuid() }),
})

sample({
  clock: submitted,
  target: [sendMessageMutation.start, form.empty],
})

sample({
  clock: submitted,
  source: {
    user: $$user.$user,
    senderName: $$profile.$name,
    profile: $$profile.$profile,
    messages: $messages,
  },
  fn: ({ user, senderName, profile, messages }, payload) => {
    const lastId = messages[messages.length - 1]?.id ?? -1

    return messages.concat({
      /*
       * Should not be possible real id to prevent any conflicts
       * For example, if someone sends a message in the same moment, its id may be the same as generated here
       * Last message ID: 1
       * Your new message temporary ID: 2
       * Another user's message real ID: 2 (causes the conflict, as there are two messages with the same ID)
       * Your new message real ID: 3
       */
      id: -(lastId + 1),
      createdAt: new Date().toISOString(),
      type: ChatMessageType.UserMessage,
      attachments: payload.attachments,
      senderName,
      senderUsername: profile!.username,
      senderImage: profile!.image,
      senderRoles: user!.roles,
      userId: user!.id,
      text: payload.text,
      temporary: true,
      isPinned: false,
      trackingId: payload.trackingId,
      profileId: profile!.id,
    })
  },
  target: $messages,
})

sample({
  clock: sendMessageMutation.finished.failure,
  source: $messages,
  fn: (messages, { params }) => {
    return messages.filter((message) => {
      return message.trackingId !== params.trackingId
    })
  },
  target: $messages,
})

export const $$chatWidget = {
  initialize,
  reset,
  form,
  fields,
  $messages,
  $loadingMessages,
  $sendingMessage,
}
