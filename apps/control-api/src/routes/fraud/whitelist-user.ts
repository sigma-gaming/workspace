import { zValidator } from '@core/server'
import { UserRole } from '@dbs/games-types'
import { fraudService, roleService, userService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../../app/router'

export const whitelistUserRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      userId: z.string(),
    }),
  ),
  async (ctx) => {
    const session = ctx.get('session')
    const user = await userService.getUser(session.userId)
    roleService.assert(user, [UserRole.Admin, UserRole.Support])

    const payload = ctx.req.valid('json')

    await fraudService.whitelistUser(payload.userId)

    return ctx.json({ status: 'success' })
  },
)
