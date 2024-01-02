import { Bot } from 'grammy'
import { env } from '../shared/env'

const bot = new Bot(env.telegram.butFullToken)

function messageUser(userId: number, text: string | string[]) {
  const message = Array.isArray(text) ? text.join('\n\n') : text
  return bot.api.sendMessage(userId, message, { parse_mode: 'Markdown' })
}

export const TelegramBotService = {
  bot,
  messageUser,
}
