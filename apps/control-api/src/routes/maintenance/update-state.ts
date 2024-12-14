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

export const updateStateRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      maintenanceEnabled: z.boolean(),
      backgroundJobsEnabled: z.boolean(),
    }),
  ),
  async (ctx) => {
    const session = ctx.get('session')
    const user = await userService.getUser(session.userId)
    roleService.assert(user, UserRole.Admin)

    const currentMaintenanceEnabled =
      await maintenanceService.isMaintenanceMode()

    const payload = ctx.req.valid('json')

    if (payload.maintenanceEnabled !== currentMaintenanceEnabled) {
      await maintenanceService.setMaintenanceMode(payload.maintenanceEnabled)

      if (gamesPubsubs.ready && payload.maintenanceEnabled) {
        await gamesPubsubs.maintenanceStarted.publish()
      }
    }

    await maintenanceService.setBackgroundJobsEnabled(
      payload.backgroundJobsEnabled,
    )

    return ctx.json({
      status: 'success',
      maintenanceEnabled: payload.maintenanceEnabled,
      backgroundJobsEnabled: payload.backgroundJobsEnabled,
    })
  },
)
