import { createSingletonProxy } from '@core/di'
import { Bot } from 'grammy'
import { inject, InjectionToken, singleton } from 'tsyringe-neo'

type ChatMemberPayload = {
  chatId: number
  userId: number
  subscribed: boolean
}

export type TelegramBotOptions = {
  token: string
}

export const TelegramBotOptionsToken: InjectionToken<TelegramBotOptions> =
  Symbol('TelegramBotOptionsToken')

@singleton()
export class TelegramBotService {
  bot: Bot

  constructor(@inject(TelegramBotOptionsToken) options: TelegramBotOptions) {
    this.bot = new Bot(options.token)
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
    const chatMember = await this.bot.api.getChatMember(groupId, userId)
    return this.isSubscribedStatus(chatMember.status)
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

export const telegramBotService = createSingletonProxy(TelegramBotService)
