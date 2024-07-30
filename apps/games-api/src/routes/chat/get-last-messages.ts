import { chatService } from '@games/services'
import { Hono } from 'hono'

export const getLastMessagesRoute = new Hono().get('/', async (ctx) => {
  const lastMessages = await chatService.getLastMessages()
  return ctx.json(lastMessages)
})
