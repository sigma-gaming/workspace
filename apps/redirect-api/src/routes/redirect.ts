import { DomainApp } from '@dbs/games-types-private'
import { affiliateService, domainService } from '@games/services'
import { createRouter } from '../app/router'

export const redirectRoute = createRouter().get('/', async (ctx) => {
  const code = ctx.req.param('code')

  if (!code) {
    return ctx.text('Not found', 404)
  }

  const campaign = await affiliateService.getCampaign(code)

  if (campaign) {
    await affiliateService.incrementCampaignVisits({ campaignId: campaign.id })
  }

  const domain = domainService.getLatestDomain(DomainApp.GamesApp)

  if (!domain) {
    return ctx.text('Try again later', 503)
  }

  return ctx.redirect(`https://${domain.host}/?r=${code}`)
})
