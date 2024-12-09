import { retry } from '@core/flow'
import { logger as coreLogger } from '@core/logger'
import { currencyRatesService, maintenanceService } from '@games/services'
import { CronJob } from 'cron'

const logger = coreLogger.child('UpdateCurrencyRatesJob')

export const updateCurrencyRatesJob = CronJob.from({
  cronTime: '*/5 * * * *', // every 5 minutes
  runOnInit: true,
  onTick: async () => {
    if (await maintenanceService.isMaintenanceMode()) {
      logger.info('Skipped due to maintenance')
      return
    }

    const result = await retry({
      fn: () => currencyRatesService.updateRates(),
      maxAttempts: 3,
      delay: 1000,
    })

    if (result.succeeded) {
      logger.info('Currency rates updated successfully')
    } else {
      logger.error('Failed to update currency rates', result.error)
      console.error(result.error)
    }
  },
})
