import { BadRequestException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { ReferrerBalanceTable, ReferrerSettingsTable } from '@dbs/games-schema'
import { affiliateService, locks, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const connectRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)

  return locks.with([locks.referrerBalance(user.id)], async () => {
    const existingSettings = await affiliateService.getReferrerSettings(user.id)

    if (existingSettings) {
      throw new BadRequestException({
        message: 'Вы уже подключены к партнерской программе',
      })
    }

    await gamesDb.transaction(async (tx) => {
      await tx
        .insert(ReferrerSettingsTable)
        .values({
          referrerId: user.id,
          referralLossShare: 25,
        })
        .returning()

      await tx
        .insert(ReferrerBalanceTable)
        .values({
          referrerId: user.id,
          available: 0,
        })
        .returning()

      await affiliateService.createReferralCampaign({
        tx,
        payload: {
          referrerId: user.id,
          name: 'Основная кампания',
        },
      })

      await affiliateService.createReferrerPayout({
        tx,
        referrerId: user.id,
      })
    })

    return ctx.json({ status: 'success' })
  })
})
