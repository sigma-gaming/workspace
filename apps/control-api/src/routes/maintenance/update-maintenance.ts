import { zValidator } from '@core/server'
import { UserRole } from '@dbs/games-types'
import { gamesPubsubs, maintenanceCache } from '@games/redis'
import { roleService } from '@games/services'
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
    const user = ctx.get('user')
    roleService.assert(user, UserRole.Admin)

    const payload = ctx.req.valid('json')
    await maintenanceCache.setMaintenanceMode(payload.value)

    if (payload.value) {
      await gamesPubsubs.maintenanceStarted.publish()
    }

    return ctx.json({ status: 'success', maintenanceMode: payload.value })
  },
)
