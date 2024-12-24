import { limitByIp, zValidator } from '@core/server'
import { Engine, PincodePayloadSchema } from '@games/engine'
import { BalanceUpdate, UpdateMode } from '@games/model'
import { gamesPubsubs, sessionService } from '@games/services'
import { createRouter } from '../../app/router'
import { metrics, updateBetMetrics } from '../../metrics'

export const playPincode = createRouter().post(
  '/',
  limitByIp({ limit: 15, windowMs: 10 * 1000 }),
  zValidator('json', PincodePayloadSchema),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const { userId } = await sessionService.getHonoSession(ctx)

    const { record, updatedBalance } = await Engine.playPincode({
      userId,
      payload,
    })

    updateBetMetrics(record)

    metrics.pincodeGamesCounter.inc({
      mode: payload.mode,
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
