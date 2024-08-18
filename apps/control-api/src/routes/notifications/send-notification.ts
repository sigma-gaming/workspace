import { UserRole } from '@dbs/games-types'
import { NotificationSchema } from '@games/model'
import { notificationService, roleService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { createRouter } from '../../hono'

export const sendRoute = createRouter().post(
  '/',
  zValidator('json', NotificationSchema),
  async (ctx) => {
    const user = ctx.get('user')
    roleService.assert(user, UserRole.Admin)

    const payload = ctx.req.valid('json')
    await notificationService.send(payload)
    return ctx.json({ status: 'success' })
  },
)
