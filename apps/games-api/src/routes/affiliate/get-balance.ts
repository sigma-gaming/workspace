import { BadRequestException } from '@core/exceptions'
import { affiliateService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getBalanceRoute = createRouter().get('/', async (ctx) => {
  const { userId } = sessionService.getHonoSession(ctx)
  const balance = await affiliateService.getReferrerBalance(userId)

  if (!balance) {
    throw new BadRequestException({
      message: 'Вы не подключены к партнерской программе',
    })
  }

  return ctx.json(balance)
})
