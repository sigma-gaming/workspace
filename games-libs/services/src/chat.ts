import { gamesDb } from '@dbs/games-db'
import {
  ChatMessageAttachment,
  ChatMessageAttachmentGame,
  ChatMessageAttachmentType,
  ChatMessageInsert,
  ChatMessageSelect,
  ChatMessageTable,
  ChatMessageType,
  UserRole,
} from '@dbs/games-schema'
import { gamesCaches, gamesPubsubs } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { BadRequestException, InternalServerException } from '@libs/exceptions'
import { desc } from 'drizzle-orm'
import { singleton } from 'tsyringe'
import { profileService } from './profile'
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

  private async getLastMessagesUnlocked(): Promise<ChatMessageSelect[]> {
    const lastMessages = await gamesCaches.lastChatMessages.get()
    if (lastMessages) return lastMessages

    const messages = await gamesDb.query.ChatMessageTable.findMany({
      orderBy: desc(ChatMessageTable.createdAt),
      limit: 100,
    })

    await gamesCaches.lastChatMessages.set(messages)

    return messages
  }

  async getLastMessages(): Promise<ChatMessageSelect[]> {
    const lock = await gamesCaches.lastChatMessages.lock(10000)

    try {
      return await this.getLastMessagesUnlocked()
    } finally {
      await lock.release()
    }
  }

  async sendMessage(options: {
    userId?: string
    payload: {
      text?: string
      attachments?: ChatMessageAttachment[]
      trackingId?: string
    }
  }): Promise<ChatMessageSelect> {
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

      let chatMessageInsert: ChatMessageInsert

      if (userId) {
        const detailedProfile = await profileService.getDetailedProfile(userId)

        chatMessageInsert = {
          type: ChatMessageType.UserMessage,
          text,
          attachments,
          senderName: detailedProfile.name,
          senderUsername: detailedProfile.username,
          senderImage: detailedProfile.image,
          senderRoles: detailedProfile.roles,
          trackingId: payload.trackingId,
        }
      } else {
        chatMessageInsert = {
          type: ChatMessageType.SystemMessage,
          text,
          attachments,
          senderRoles: [UserRole.Admin],
        }
      }

      const [message] = await gamesDb
        .insert(ChatMessageTable)
        .values(chatMessageInsert)
        .returning()

      const lastChatMessages = await this.getLastMessagesUnlocked()
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
