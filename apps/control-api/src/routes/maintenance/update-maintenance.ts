import { zValidator } from '@core/server'
import { UserRole } from '@dbs/games-types'
import {
  gamesPubsubs,
  maintenanceService,
  roleService,
  userService,
} from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const updateMaintenanceRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      value: z.boolean(),
    }),
  ),
  async (ctx) => {
    const session = ctx.get('session')
    const user = await userService.getUser(session.userId)
    roleService.assert(user, UserRole.Admin)

    const payload = ctx.req.valid('json')
    await maintenanceService.setMaintenanceMode(payload.value)

    if (payload.value) {
      await gamesPubsubs.maintenanceStarted.publish()
    }

    return ctx.json({ status: 'success', maintenanceMode: payload.value })
  },
)
