import { currencyRatesService } from '@games/services'
import { createJob } from '../shared/jobs'

export const updateCurrencyRatesJob = createJob({
  name: 'UpdateCurrencyRates',
  cronTime: '*/5 * * * *', // every 5 minutes
  handler: () => currencyRatesService.updateRates(),
})
