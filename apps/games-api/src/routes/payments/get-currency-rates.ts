import { CurrencyExchangeRates } from '@games/model'
import { currencyRatesService } from '@games/services'
import { createRouter } from '../../hono'

export const getCurrencyRatesRoute = createRouter().get('/', async (ctx) => {
  const rates = await currencyRatesService.getRates()

  if (!rates) {
    return ctx.json<CurrencyExchangeRates>({})
  }

  return ctx.json<CurrencyExchangeRates>(rates)
})
