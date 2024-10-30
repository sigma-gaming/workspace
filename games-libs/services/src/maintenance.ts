import { createLazyInstance } from '@core/di'
import { Logger, loggerService } from '@core/logger'
import { gamesCache } from './cache'

export class MaintenanceService {
  private readonly logger: Logger

  constructor() {
    this.logger = loggerService.logger.child('MaintenanceCache')
  }

  async isMaintenanceMode() {
    if (!gamesCache.ready) {
      return true
    }

    for (let i = 0; i < 3; i++) {
      try {
        const value = await gamesCache.maintenance.get()
        return value ?? false
      } catch (error) {
        this.logger.info('Failed to get maintenance mode:')
        this.logger.error(error)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        this.logger.info('Retrying in 1 second...')
      }
    }

    return true
  }

  async setMaintenanceMode(value: boolean) {
    if (!gamesCache.ready) return null
    await gamesCache.maintenance.set(value)
    return value
  }
}

export const maintenanceService = createLazyInstance(MaintenanceService)
