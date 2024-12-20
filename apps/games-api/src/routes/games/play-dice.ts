import { limitByIp, zValidator } from '@core/server'
import { DicePayloadSchema, Engine } from '@games/engine'
import { BalanceUpdate, UpdateMode } from '@games/model'
import { gamesPubsubs, sessionService } from '@games/services'
import { createRouter } from '../../app/router'

export const playDice = createRouter().post(
  '/',
  limitByIp({ limit: 15, windowMs: 10 * 1000 }),
  zValidator('json', DicePayloadSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const { userId } = await sessionService.getHonoSession(ctx)

    const { record, updatedBalance } = await Engine.playDice({
      userId,
      payload,
    })

    const balance: BalanceUpdate = {
      time: Date.now(),
      mode: UpdateMode.Optimized,
      available: updatedBalance,
    }

    gamesPubsubs.balanceUpdated.publish({
      userId,
      update: balance,
    })

    return ctx.json({
      record,
      balance,
    })
  },
)
