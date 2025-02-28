import { createLazyInstance, resolveOptions } from '@core/di'
import { logger as rootLogger, Logger } from '@core/logger'
import { TelegramBotOptionsToken } from '@games/options'
import { Bot, GrammyError } from 'grammy'

type ChatMemberPayload = {
  chatId: number
  userId: number
  subscribed: boolean
}

export class TelegramBotService {
  bot: Bot
  logger: Logger

  constructor() {
    const { token } = resolveOptions(TelegramBotOptionsToken)
    this.bot = new Bot(token)
    this.logger = rootLogger.child('TelegramBotService')
  }

  messageUser(userId: number, text: string | string[]) {
    const message = Array.isArray(text) ? text.join('\n\n') : text
    return this.bot.api.sendMessage(userId, message, { parse_mode: 'Markdown' })
  }

  private isSubscribedStatus(status: string) {
    const acceptedStatuses = [
      'member',
      'administrator',
      'creator',
      'restricted',
    ]

    return acceptedStatuses.includes(status)
  }

  async checkSubscription(userId: number, groupId: number) {
    try {
      const chatMember = await this.bot.api.getChatMember(groupId, userId)
      this.logger.info({ chatMember }, 'Chat member')
      return this.isSubscribedStatus(chatMember.status)
    } catch (error) {
      if (error instanceof GrammyError && error.error_code === 404) {
        return false
      }

      throw new Error('Failed to check subscription')
    }
  }

  onChatMember(handler: (payload: ChatMemberPayload) => void) {
    this.bot.on('chat_member', (ctx) => {
      const chatId = ctx.chatMember.chat.id
      const userId = ctx.chatMember.new_chat_member.user.id
      const subscribed = this.isSubscribedStatus(
        ctx.chatMember.new_chat_member.status,
      )

      handler({
        chatId,
        userId,
        subscribed,
      })
    })
  }
}

export const telegramBotService = createLazyInstance(TelegramBotService)
