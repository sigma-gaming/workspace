import { UserRole } from '@dbs/games-types'
import { promocodeService, roleService } from '@games/services'
import { createRouter } from '../../hono'

export const generateRoute = createRouter().post('/', async (ctx) => {
  const user = ctx.get('user')
  roleService.assert(user, UserRole.Admin)

  const promocode = promocodeService.generateOne()
  return ctx.json({ status: 'success', promocode })
})
