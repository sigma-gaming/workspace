import { createSingletonProxy } from '@libs/di'
import { Bot } from 'grammy'
import { singleton } from 'tsyringe'
import { EnvService } from './env'

@singleton()
export class TelegramBotService {
  bot: Bot

  constructor({ env }: EnvService) {
    this.bot = new Bot(env.telegram.butFullToken)
  }

  messageUser(userId: number, text: string | string[]) {
    const message = Array.isArray(text) ? text.join('\n\n') : text
    return this.bot.api.sendMessage(userId, message, { parse_mode: 'Markdown' })
  }
}

export const telegramBotService = createSingletonProxy(TelegramBotService)
