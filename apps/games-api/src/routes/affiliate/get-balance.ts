import { BadRequestException } from '@core/exceptions'
import { affiliateService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getBalanceRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const balance = await affiliateService.getReferrerBalance(user.id)

  if (!balance) {
    throw new BadRequestException({
      message: 'Вы не подключены к партнерской программе',
    })
  }

  return ctx.json(balance)
})
