import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { gamesDb } from '@dbs/games-db'
import { ReferralCampaignTable } from '@dbs/games-schema'
import { affiliateService, sessionService } from '@games/services'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const getCampaingsRoute = createRouter().get(
  '/',
  zValidator(
    'query',
    z.object({ offset: z.coerce.number().min(0).default(0) }),
  ),
  async (ctx) => {
    const session = ctx.get('session')
    const user = sessionService.getUser(session)
    const settings = await affiliateService.getReferrerSettings(user.id)
    const { offset } = ctx.req.valid('query')

    if (!settings) {
      throw new BadRequestException({
        message: 'Вы не подключены к партнерской программе',
      })
    }

    const where = eq(ReferralCampaignTable.referrerId, user.id)

    const campaigns = await gamesDb.query.ReferralCampaignTable.findMany({
      where,
      orderBy: desc(ReferralCampaignTable.createdAt),
      limit: 10,
      offset,
    })

    const [{ totalCount }] = await gamesDb
      .select({ totalCount: count().mapWith(Number) })
      .from(ReferralCampaignTable)
      .where(where)

    return ctx.json({ campaigns, totalCount })
  },
)
