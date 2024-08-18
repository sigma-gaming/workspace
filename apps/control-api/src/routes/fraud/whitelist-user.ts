import { UserRole } from '@dbs/games-types'
import { fraudService, roleService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const whitelistUserRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      userId: z.string(),
    }),
  ),
  async (ctx) => {
    const user = ctx.get('user')
    roleService.assert(user, [UserRole.Admin, UserRole.Support])

    const payload = ctx.req.valid('json')

    await fraudService.whitelistUser(payload.userId)

    return ctx.json({ status: 'success' })
  },
)
