import { tbValidator, TypeboxError } from '@core/server'
import { ChatMessageAttachmentType } from '@dbs/games-types'
import { chatService, sessionService } from '@games/services'
import { Type } from '@sinclair/typebox'
import { createRouter } from '../../app/router'
import { limitByIp } from '../../middlewares/rate-limit'

const PayloadSchema = Type.Object({
  message: Type.String({
    minLength: 1,
    maxLength: 256,
  }),
  attachments: Type.Array(
    Type.Object({
      type: Type.Enum(ChatMessageAttachmentType),
      gameRecordId: Type.Number(),
    }),
    { maxItems: 1 },
  ),
  trackingId: Type.String({ format: 'uuid' }),
})

export const sendMessageRoute = createRouter().post(
  '/',
  limitByIp({ limit: 20, windowMs: 60 * 1000 }),
  tbValidator('json', PayloadSchema, {
    message: {
      [TypeboxError.StringMinLength]: 'Слишком короткое сообщение',
      [TypeboxError.StringMaxLength]: 'Слишком длинное сообщение',
    },
    attachments: {
      [TypeboxError.ArrayMaxItems]: 'Доступно только одно вложение',
    },
  }),
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
