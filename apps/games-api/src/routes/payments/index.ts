import { createRouter } from '../../hono'
import { depositRoute } from './deposit'
import { getConfigRoute } from './get-config'
import { getCurrencyRatesRoute } from './get-currency-rates'
import { withdrawRoute } from './withdraw'

export const paymentsRouter = createRouter()
  .route('/getConfig', getConfigRoute)
  .route('/getCurrencyRates', getCurrencyRatesRoute)
  .route('/deposit', depositRoute)
  .route('/withdraw', withdrawRoute)
