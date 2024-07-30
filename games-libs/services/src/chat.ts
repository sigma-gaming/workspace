import { createSingletonProxy } from '@core/di'
import { BadRequestException, InternalServerException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import {
  ChatMessageInsert,
  ChatMessageSelect,
  ChatMessageTable,
} from '@dbs/games-schema'
import {
  ChatMessageAttachment,
  ChatMessageAttachmentGame,
  ChatMessageAttachmentType,
  ChatMessageType,
  UserRole,
} from '@dbs/games-types'
import { gamesCaches, gamesPubsubs } from '@games/redis'
import { desc } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
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

  async initializeMessages() {
    const lock = await gamesCaches.lastChatMessages.lock(3000)

    try {
      const exists = await gamesCaches.lastChatMessages.exists()
      if (exists) return

      const messages = await gamesDb.query.ChatMessageTable.findMany({
        orderBy: desc(ChatMessageTable.createdAt),
        limit: 100,
      })

      await gamesCaches.lastChatMessages.set(messages.reverse())
    } finally {
      await lock.release()
    }
  }

  async getLastMessages(): Promise<ChatMessageSelect[]> {
    return gamesCaches.lastChatMessages.get()
  }

  async sendMessage(options: {
    userId?: string
    payload: {
      text?: string
      attachments?: ChatMessageAttachment[]
      trackingId?: string
    }
  }): Promise<ChatMessageSelect> {
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

    await gamesCaches.lastChatMessages.push(message)
    await gamesPubsubs.chatMessages.publish(message)

    return message
  }
}

export const chatService = createSingletonProxy(ChatService)
