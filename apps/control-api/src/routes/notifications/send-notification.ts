import { NotificationSchema } from '@games/model'
import { notificationService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

export const sendRoute = new Hono().post(
  '/',
  zValidator('json', NotificationSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    await notificationService.send(payload)
    return ctx.json({ status: 'success' })
  },
)
