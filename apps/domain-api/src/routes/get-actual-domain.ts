import { DomainApp } from '@dbs/games-types-private'
import { domainService } from '@games/services'
import { createRouter } from '../app/router'

export const getActualDomainRoute = createRouter().get('/', async (ctx) => {
  const domain = domainService.getLatestDomain(DomainApp.GamesApp)

  if (!domain) {
    return ctx.text('Try again later', 503)
  }

  return ctx.json({ host: domain.host })
})
