import { BadRequestException } from '@core/exceptions'
import { ReferrerBalanceTable, ReferrerSettingsTable } from '@dbs/games-schema'
import { affiliateService, gamesDb, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const connectRoute = createRouter().post('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)

  const existingSettings = await affiliateService.getReferrerSettings(userId)

  if (existingSettings) {
    throw new BadRequestException({
      message: 'Вы уже подключены к партнерской программе',
    })
  }

  await gamesDb.transaction(async (tx) => {
    await tx
      .insert(ReferrerSettingsTable)
      .values({
        referrerId: userId,
        revShare: 25,
      })
      .returning()

    await tx
      .insert(ReferrerBalanceTable)
      .values({
        referrerId: userId,
        available: 0,
      })
      .returning()

    await affiliateService.createReferralCampaign({
      tx,
      payload: {
        referrerId: userId,
        name: 'Основная кампания',
      },
    })

    await affiliateService.createReferrerPayout({
      tx,
      referrerId: userId,
    })
  })

  return ctx.json({ status: 'success' })
})
