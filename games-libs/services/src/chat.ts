import { createSingletonProxy } from '@libs/di'
import { BadRequestException, InternalServerException } from '@libs/exceptions'
import { gamesDb } from '@games/db'
import {
  ChatMessageAttachment,
  ChatMessageAttachmentGame,
  ChatMessageAttachmentType,
  ChatMessages,
  ChatMessageType,
} from '@games/db-schema'
import { gamesCaches, gamesPubsubs } from '@games/redis'
import { singleton } from 'tsyringe'
import { TransactionService } from './transaction'

@singleton()
export class ChatService {
  constructor(private readonly transactionService: TransactionService) {}

  private async validateUserGameAttachment(
    userId: string,
    attachment: ChatMessageAttachmentGame,
  ) {
    const transaction = await this.transactionService.getTransaction(
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

  async sendMessage(options: {
    userId?: string
    payload: {
      text?: string
      attachments?: ChatMessageAttachment[]
    }
  }) {
    const lock = await gamesCaches.lastChatMessages.lock(10000)

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
          await this.validateUserGameAttachment(userId, attachment)
        }
      }

      const [message] = await gamesDb
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

      const lastChatMessages = (await gamesCaches.lastChatMessages.get()) ?? []
      lastChatMessages.push(message)

      while (lastChatMessages.length > 100) {
        lastChatMessages.shift()
      }

      await gamesCaches.lastChatMessages.set(lastChatMessages)
      await gamesPubsubs.chatMessages.publish(message)

      return message
    } finally {
      await lock.release()
    }
  }
}

export const chatService = createSingletonProxy(ChatService)
