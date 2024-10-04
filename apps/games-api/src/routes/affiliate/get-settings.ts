import { BadRequestException } from '@core/exceptions'
import { affiliateService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getSettingsRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const settings = await affiliateService.getReferrerSettings(user.id)

  if (!settings) {
    throw new BadRequestException({
      message: 'Вы не подключены к партнерской программе',
    })
  }

  return ctx.json(settings)
})
