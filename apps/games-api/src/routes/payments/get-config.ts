import { PaymentConfigLists } from '@games/model'
import { paymentService } from '@games/services'
import { createRouter } from '../../hono'

export const getConfigRoute = createRouter().get('/', async (ctx) => {
  const deposit = await paymentService.getDepositConfigList()
  const withdrawal = await paymentService.getWithdrawalConfigList()

  return ctx.json<PaymentConfigLists>({ deposit, withdrawal })
})
