import { BadRequestException } from '@core/exceptions'
import { affiliateService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getSettingsRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const settings = await affiliateService.getReferrerSettings(userId)

  if (!settings) {
    throw new BadRequestException({
      message: 'Вы не подключены к партнерской программе',
    })
  }

  return ctx.json(settings)
})
