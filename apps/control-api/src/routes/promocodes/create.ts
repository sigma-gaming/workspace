import { UserRole } from '@dbs/games-types'
import { roleService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const create = createRouter().post(
  '/',
  zValidator('json', z.object({})),
  async (ctx) => {
    const user = ctx.get('user')
    roleService.assert(user, UserRole.Admin)

    return ctx.json({ status: 'success' })
  },
)
