import { limitByIp, zValidator } from '@core/server'
import { ChatValidation } from '@games/model'
import { chatService, sessionService } from '@games/services'
import { createRouter } from '../../app/router'

export const sendMessageRoute = createRouter().post(
  '/',
  limitByIp({ limit: 20, windowMs: 60 * 1000 }),
  zValidator('json', ChatValidation.MessagePayloadSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const { userId } = await sessionService.getHonoSession(ctx)

    const chatMessage = await chatService.sendMessage({
      userId,
      payload,
    })

    return ctx.json(chatMessage)
  },
)
