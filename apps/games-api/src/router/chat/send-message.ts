import { ChatValidation } from '@games/model'
import { chatService, sessionService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

export const sendMessageRoute = new Hono().post(
  '/',
  zValidator('json', ChatValidation.MessagePayloadSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const session = await sessionService.getSession(ctx.req)
    const user = sessionService.getUser(session)

    const chatMessage = await chatService.sendMessage({
      userId: user.id,
      payload,
    })

    return ctx.json(chatMessage)
  },
)
