import { UserRole } from '@dbs/games-types'
import { promocodeService, roleService, userService } from '@games/services'
import { createRouter } from '../../hono'

export const generateRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = await userService.getUser(session.userId)
  roleService.assert(user, UserRole.Admin)

  const promocode = promocodeService.generateOne()
  return ctx.json({ status: 'success', promocode })
})
