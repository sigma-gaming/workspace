import { createLazyInstance } from '@core/di'
import { Logger, loggerService } from '@core/logger'
import { sleep } from '@core/utils'
import { ConfigTable } from '@dbs/games-schema'
import { gamesCache } from './cache'
import { gamesDb } from './db'

export class MaintenanceService {
  private readonly logger: Logger

  constructor() {
    this.logger = loggerService.logger.child('MaintenanceService')
  }

  private async queryMaintenanceEnabled() {
    const config = await gamesDb.query.ConfigTable.findFirst()
    if (!config) throw new Error('Config not found')
    return config.maintenanceEnabled
  }

  private async checkMaintenanceEnabled() {
    if (!gamesCache.ready) return this.queryMaintenanceEnabled()
    const cached = await gamesCache.maintenance.get()
    if (cached !== null) return cached
    const maintenance = await this.queryMaintenanceEnabled()
    await gamesCache.maintenance.set(maintenance)
    return maintenance
  }

  async isMaintenanceEnabled() {
    for (let i = 0; i < 3; i++) {
      try {
        return await this.checkMaintenanceEnabled()
      } catch (error) {
        this.logger.info('Failed to get maintenance mode:')
        this.logger.error(error)
        this.logger.info('Retrying in 1 second...')
        await sleep(1000)
      }
    }

    return true
  }

  async setMaintenanceEnabled(state: boolean) {
    await gamesDb.update(ConfigTable).set({ maintenanceEnabled: state })
    if (!gamesCache.ready) return state
    await gamesCache.maintenance.set(state)
    return state
  }

  async queryBackgroundJobsEnabled() {
    const config = await gamesDb.query.ConfigTable.findFirst()
    if (!config) throw new Error('Config not found')
    return config.backgroundJobsEnabled
  }

  async areBackgroundJobsEnabled() {
    if (!gamesCache.ready) return this.queryBackgroundJobsEnabled()
    const cached = await gamesCache.backgroundJobsEnabled.get()
    if (cached !== null) return cached
    const enabled = await this.queryBackgroundJobsEnabled()
    await gamesCache.backgroundJobsEnabled.set(enabled)
    return enabled
  }

  async setBackgroundJobsEnabled(state: boolean) {
    await gamesDb.update(ConfigTable).set({ backgroundJobsEnabled: state })
    if (!gamesCache.ready) return state
    await gamesCache.backgroundJobsEnabled.set(state)
    return state
  }
}

export const maintenanceService = createLazyInstance(MaintenanceService)
