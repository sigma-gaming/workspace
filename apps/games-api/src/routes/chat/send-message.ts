import { zValidator } from '@core/server'
import { ChatValidation } from '@games/model'
import { chatService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const sendMessageRoute = createRouter().post(
  '/',
  zValidator('json', ChatValidation.MessagePayloadSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const session = ctx.get('session')
    const user = sessionService.getUser(session)

    const chatMessage = await chatService.sendMessage({
      userId: user.id,
      payload,
    })

    return ctx.json(chatMessage)
  },
)
