import { PaymentConfigLists } from '@games/model'
import { paymentService } from '@games/services'
import { createRouter } from '../../hono'

export const getConfigRoute = createRouter().get('/', (ctx) => {
  const deposit = paymentService.getDepositConfigList()
  const withdrawal = paymentService.getWithdrawalConfigList()

  return ctx.json<PaymentConfigLists>({ deposit, withdrawal })
})
