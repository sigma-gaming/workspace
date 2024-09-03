import { $$notifications, createApiEffect } from '@core/client'
import { createField, createForm } from '@core/forms'
import { subscriptionFactory } from '@core/io-client'
import { ChatMessageSelect } from '@dbs/games-schema'
import { ChatMessageAttachment, ChatMessageType } from '@dbs/games-types'
import { ChatValidation } from '@games/model'
import { NotificationData } from '@mantine/notifications'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { v4 as uuid } from 'uuid'
import { $$profile } from '../../entities/profile'
import { $$user } from '../../entities/user'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const initialize = createEvent()
const reset = createEvent()

const getLastMessagesFx = createApiEffect(gamesApi.chat.getLastMessages.$get)
const sendMessageFx = createApiEffect(gamesApi.chat.sendMessage.$post)

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

export type ExtendedMessage = ChatMessageSelect & {
  temporary?: boolean
}

const $messages = createStore<ExtendedMessage[]>([]).reset(reset)

sample({
  clock: initialize,
  target: getLastMessagesFx,
})

sample({
  clock: getLastMessagesFx.doneData,
  source: $messages,
  fn: (messages, actualMessages) => {
    const ids = messages.map((message) => message.id)

    const newMessages = actualMessages.filter(
      (message) => !ids.includes(message.id),
    )

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
  target: [sendMessageFx, form.empty],
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
      isPinned: true,
      trackingId: payload.trackingId,
    })
  },
  target: $messages,
})

sample({
  clock: sendMessageFx.fail,
  source: $messages,
  fn: (messages, { params }) => {
    return messages.filter((message) => {
      return message.trackingId !== params.trackingId
    })
  },
})

sample({
  clock: sendMessageFx.fail,
  fn: (): NotificationData => ({
    title: 'Ошибка отправки сообщения',
    message: 'Что-то пошло не так, попробуйте через пару минут',
    color: 'red',
  }),
  target: $$notifications.show,
})

export const $$chatWidget = {
  initialize,
  reset,
  form,
  fields,
  $messages,
  $loadingMessages,
}
