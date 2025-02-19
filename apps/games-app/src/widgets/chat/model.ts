import { createField, createForm } from '@core/forms'
import { createMutation } from '@farfetched/core'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { v7 } from 'uuid'
import { z } from 'zod'
import { $$profile } from '../../entities/profile'
import { $$user } from '../../entities/user'
import {
  ChatMessage,
  ChatMessageAttachment,
  ChatMessageAttachmentType,
  ChatMessageType,
  getChatLastMessages,
  postChatSendMessage,
} from '../../shared/api/core'
import { $$coreWs, EventName } from '../../shared/api/core-ws'
import { createApiEffect } from '../../shared/api/effects'
import { handleExceptions } from '@core/client'

const initialize = createEvent()
const reset = createEvent()

const getLastMessagesFx = createApiEffect(getChatLastMessages)

const sendMessageMutation = createMutation({
  name: 'chat/sendMessage',
  effect: createApiEffect(postChatSendMessage),
})

const $loadingMessages = createStore(true)
  .on(getLastMessagesFx.done, () => false)
  .reset(reset)

const { receivedData: messageReceived } = invoke(() => {
  return $$coreWs.subscriptionFactory(EventName.ChatMessageCreated)
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
  schema: z.strictObject({
    text: z
      .string()
      .min(1, 'Слишком короткое сообщение')
      .max(512, 'Слишком длинное сообщение'),
    attachments: z
      .array(
        z.object({
          type: z.literal(ChatMessageAttachmentType.Game),
          gameRecordId: z.string().uuid(),
        }),
      )
      .max(1, 'Доступно только одно вложение'),
  }),
})

handleExceptions(sendMessageMutation, { form })

export type ExtendedMessage = ChatMessage & {
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

    return messages.concat(newMessages).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
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
  fn: (payload) => ({ ...payload, trackingId: v7() }),
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
    userDetails: $$profile.$userDetails,
    messages: $messages,
  },
  fn: ({ user, senderName, userDetails, messages }, payload) => {
    const message: ExtendedMessage = {
      id: v7(),
      createdAt: new Date().toISOString(),
      type: ChatMessageType.UserMessage,
      attachments: payload.attachments,
      senderName,
      senderUsername: userDetails!.profile.username,
      senderImage: userDetails!.profile.image,
      senderRoles: user!.roles,
      userId: user!.id,
      text: payload.text,
      temporary: true,
      isPinned: false,
      trackingId: payload.trackingId,
      profileId: userDetails!.profile.id,
    }

    return messages.concat(message)
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
