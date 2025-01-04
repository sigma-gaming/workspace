import { createLazyInstance } from '@core/di'
import { loggerService } from '@core/logger'
import { DomainSelect, DomainTable } from '@dbs/games-schema'
import { DomainApp } from '@dbs/games-types-private'
import { gamesDb } from '@games/services'
import { desc } from 'drizzle-orm'

export class DomainService {
  private logger = loggerService.logger.child('Domain')
  private cached: DomainSelect[] = []
  private initializationPromise: Promise<void>

  constructor() {
    this.initializationPromise = this.initialize()
  }

  private async queryDomains() {
    return await gamesDb.query.DomainTable.findMany({
      orderBy: desc(DomainTable.createdAt),
    })
  }

  async initialize() {
    try {
      await this.refreshDomains()

      setInterval(
        () => this.refreshDomains(),
        1000 * 60 * 5, // 5 minutes
      )
    } catch {
      const message = 'Failed to initialize domains, retrying in 5 seconds...'
      this.logger.error(message)
      setTimeout(() => this.initialize(), 5000)
    }
  }

  async waitForInitialization() {
    await this.initializationPromise
  }

  async refreshDomains() {
    const domains = await this.queryDomains()
    this.cached = domains
  }

  getDomains(apps?: DomainApp[]) {
    if (!apps) return this.cached

    return this.cached.filter((domain) => apps.includes(domain.app))
  }

  getLatestDomain(app: DomainApp) {
    return this.cached.find((domain) => domain.app === app) ?? null
  }

  originMatches(origin?: string, apps?: DomainApp[]) {
    if (!origin) return false

    const domains = this.getDomains(apps)
    const host = origin.replace('https://', '')

    return domains.some((domain) => {
      return host === domain.host
    })
  }
}

export const domainService = createLazyInstance(DomainService)
