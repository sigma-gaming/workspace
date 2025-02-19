import { DomainApp } from '@dbs/games-types-private'
import { domainService } from '@games/services'
import { createRouter } from '../app/router'

export const domainsRoute = createRouter().get('/', async (ctx) => {
  const domains = domainService.getDomainsByApp(DomainApp.CoreApp)
  return ctx.json(domains.map(({ host }) => ({ host })))
})
