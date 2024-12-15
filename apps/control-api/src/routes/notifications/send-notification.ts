import { zValidator } from '@core/server'
import { UserRole } from '@dbs/games-types'
import { NotificationSchema } from '@games/model'
import { notificationService, roleService, userService } from '@games/services'
import { createRouter } from '../../app/router'

export const sendRoute = createRouter().post(
  '/',
  zValidator('json', NotificationSchema),
  async (ctx) => {
    const session = ctx.get('session')
    const user = await userService.getUser(session.userId)
    roleService.assert(user, UserRole.Admin)

    const payload = ctx.req.valid('json')
    await notificationService.send(payload)
    return ctx.json({ status: 'success' })
  },
)
