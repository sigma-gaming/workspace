import { createLazyInstance } from '@core/di'
import { Logger, loggerService } from '@core/logger'
import { sleep } from '@core/utils'
import { ConfigTable } from '@dbs/games-schema'
import { gamesCache } from './cache'
import { gamesDb } from './db'

export class MaintenanceService {
  private readonly logger: Logger

  constructor() {
    this.logger = loggerService.logger.child('MaintenanceCache')
  }

  private async queryMaintenance() {
    const [config] = await gamesDb.query.ConfigTable.findMany()
    if (!config) throw new Error('Config not found')
    return config.maintenanceEnabled
  }

  private async getMaintenance() {
    if (!gamesCache.ready) return this.queryMaintenance()
    const cached = await gamesCache.maintenance.get()
    if (cached !== null) return cached
    const maintenance = await this.queryMaintenance()
    await gamesCache.maintenance.set(maintenance)
    return maintenance
  }

  async isMaintenanceMode() {
    for (let i = 0; i < 3; i++) {
      try {
        return await this.getMaintenance()
      } catch (error) {
        this.logger.info('Failed to get maintenance mode:')
        this.logger.error(error)
        this.logger.info('Retrying in 1 second...')
        await sleep(1000)
      }
    }

    return true
  }

  async setMaintenanceMode(state: boolean) {
    await gamesDb.update(ConfigTable).set({ maintenanceEnabled: state })
    if (!gamesCache.ready) return state
    await gamesCache.maintenance.set(state)
    return state
  }
}

export const maintenanceService = createLazyInstance(MaintenanceService)
