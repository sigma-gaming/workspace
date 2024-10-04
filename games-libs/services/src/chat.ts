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
import { ChatMessageDetailed, ProfileDetailed } from '@games/model'
import { gamesCaches, gamesPubsubs } from '@games/redis'
import { desc } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { GameService } from './game'
import { locks } from './locks'
import { profileService } from './profile'

@singleton()
export class ChatService {
  constructor(private readonly gameService: GameService) {}

  private async validateUserGameAttachment(
    userId: string,
    attachment: ChatMessageAttachmentGame,
  ) {
    const gameRecord = await this.gameService.getGameRecord(
      attachment.gameRecordId,
    )

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
    return await locks.with([locks.chat()], async () => {
      const exists = await gamesCaches.lastChatMessages.exists()

      if (exists) {
        await gamesCaches.lastChatMessages.extend()
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

      await gamesCaches.lastChatMessages.set(detailedMessages.reverse())
    })
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

    const [message] = await gamesDb
      .insert(ChatMessageTable)
      .values(chatMessageInsert)
      .returning()

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

    await gamesCaches.lastChatMessages.push(detailedMessage)
    await gamesPubsubs.chatMessages.publish(detailedMessage)

    return message
  }
}

export const chatService = createSingletonProxy(ChatService)
