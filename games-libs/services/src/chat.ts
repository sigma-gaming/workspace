import { BadRequestException, InternalServerException } from '@core/exceptions'
import { logger } from '@core/logger'
import { takeFirstOrThrow } from '@core/utils'
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
import { ChatMessageDetailed, ProfileDetailed } from '@games/model'
import { gamesDb } from '@games/services'
import { desc } from 'drizzle-orm'
import { gamesCache } from './cache'
import { gameService } from './game'
import { profileService } from './profile'
import { gamesPubsubs } from './pubsubs'

export class ChatService {
  private async validateAttachment(
    userId: string,
    attachment: ChatMessageAttachment,
  ) {
    if (attachment.type === ChatMessageAttachmentType.Game) {
      await this.validateUserGameAttachment(userId, attachment)
      return
    }

    throw new BadRequestException({
      path: ['attachments'],
      message: 'Недопустимое вложение',
    })
  }

  private async validateUserGameAttachment(
    userId: string,
    attachment: ChatMessageAttachmentGame,
  ) {
    const gameRecord = await gameService.getGameRecord(attachment.gameRecordId)

    if (!gameRecord) {
      throw new InternalServerException()
    }

    if (gameRecord.userId !== userId) {
      throw new BadRequestException({
        path: ['attachments'],
        message: 'Нельзя отправлять чужие игры',
      })
    }
  }

  async initializeMessages() {
    if (!gamesCache.ready) {
      logger.warn('Cannot initialize chat messages, cache is not ready')
      return
    }

    const lock = await gamesCache.lastChatMessages.lock(3000)

    try {
      const exists = await gamesCache.lastChatMessages.exists()

      if (exists) {
        await gamesCache.lastChatMessages.extend()
        return
      }

      const messages = await gamesDb.query.ChatMessageTable.findMany({
        orderBy: desc(ChatMessageTable.id),
        limit: 50,
        with: {
          user: true,
          profile: true,
        },
      })

      const detailedMessages = messages.map(
        ({ user, profile, ...message }): ChatMessageDetailed => {
          return {
            ...message,
            senderName: profile?.name ?? null,
            senderUsername: profile?.username ?? null,
            senderImage: profile?.image ?? null,
            senderRoles: user?.roles ?? null,
          }
        },
      )

      await gamesCache.lastChatMessages.set(detailedMessages.reverse())
    } finally {
      await lock.release()
    }
  }

  async getLastMessages(): Promise<ChatMessageSelect[]> {
    return gamesCache.lastChatMessages.get()
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

    if (attachments.length > 1) {
      throw new BadRequestException({
        path: ['attachments'],
        message: 'Доступно только одно вложение',
      })
    }

    const [attachment] = attachments

    if (userId && attachment) {
      await this.validateAttachment(userId, attachment)
    }

    let chatMessageInsert: ChatMessageInsert
    let detailedProfile: ProfileDetailed | null = null

    if (userId) {
      detailedProfile = await profileService.getDetailedProfile(userId)

      chatMessageInsert = {
        type: ChatMessageType.UserMessage,
        text,
        attachments,
        userId,
        profileId: detailedProfile.id,
        trackingId: payload.trackingId,
      }
    } else {
      chatMessageInsert = {
        type: ChatMessageType.SystemMessage,
        text,
        attachments,
      }
    }

    const message = await gamesDb
      .insert(ChatMessageTable)
      .values(chatMessageInsert)
      .returning()
      .then(takeFirstOrThrow)

    const detailedMessage: ChatMessageDetailed = message

    if (detailedProfile) {
      detailedMessage.senderName = detailedProfile.name
      detailedMessage.senderUsername = detailedProfile.username
      detailedMessage.senderImage = detailedProfile.image
      detailedMessage.senderRoles = detailedProfile.roles
    } else {
      // System message
      detailedMessage.senderRoles = [UserRole.Admin]
    }

    await gamesCache.lastChatMessages.push(detailedMessage)
    await gamesPubsubs.chatMessages.publish(detailedMessage)

    return message
  }
}

export const chatService = new ChatService()
