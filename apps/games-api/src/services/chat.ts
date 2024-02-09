import { BadRequestException, InternalServerException } from '@libs/exceptions'
import {
  ChatMessageAttachment,
  ChatMessageAttachmentGame,
  ChatMessageAttachmentType,
  ChatMessages,
  ChatMessageType,
} from '@libs/games-db-schema'
import { db } from '../shared/db'
import { caches, pubsubs } from '../shared/redis'
import { TransactionService } from './transaction'

async function validateUserGameAttachment(
  userId: string,
  attachment: ChatMessageAttachmentGame,
) {
  const transaction = await TransactionService.getTransaction(
    attachment.transactionId,
  )

  if (!transaction) {
    throw new InternalServerException()
  }

  if (transaction.userId !== userId) {
    throw new BadRequestException({
      path: ['attachments'],
      message: 'Нельзя отправлять чужие игры',
    })
  }
}

async function sendMessage(options: {
  userId?: string
  payload: {
    text?: string
    attachments?: ChatMessageAttachment[]
  }
}) {
  const lock = await caches.lastChatMessages.lock(10000)

  try {
    const { userId, payload } = options
    const { text, attachments = [] } = payload

    if (!text && attachments.length === 0) {
      throw new BadRequestException({
        path: ['text'],
        message: 'Нельзя отправить пустое сообщение',
      })
    }

    if (userId && attachments.length > 0) {
      if (attachments.length > 1) {
        throw new BadRequestException({
          path: ['attachments'],
          message: 'Доступно только одно вложение',
        })
      }

      const [attachment] = attachments

      if (attachment.type === ChatMessageAttachmentType.Game) {
        await validateUserGameAttachment(userId, attachment)
      }
    }

    const [message] = await db
      .insert(ChatMessages)
      .values({
        type: userId
          ? ChatMessageType.UserMessage
          : ChatMessageType.SystemMessage,
        attachments,
        text,
        userId,
      })
      .returning()

    const lastChatMessages = (await caches.lastChatMessages.get()) ?? []
    lastChatMessages.push(message)

    while (lastChatMessages.length > 100) {
      lastChatMessages.shift()
    }

    await caches.lastChatMessages.set(lastChatMessages)
    await pubsubs.chatMessages.publish(message)

    return message
  } finally {
    await lock.release()
  }
}

export const ChatService = {
  sendMessage,
}
