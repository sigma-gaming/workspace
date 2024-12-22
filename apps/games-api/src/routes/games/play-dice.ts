import { limitByIp, zValidator } from '@core/server'
import { GameSnapshotDice } from '@dbs/games-types'
import { DicePayloadSchema, Engine } from '@games/engine'
import { BalanceUpdate, UpdateMode } from '@games/model'
import { gamesPubsubs, sessionService } from '@games/services'
import { createRouter } from '../../app/router'
import { metrics, updateBetMetrics } from '../../metrics'

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

    updateBetMetrics(record)

    metrics.diceSidesHistogram.observe(
      (record.snapshot as GameSnapshotDice).inputSides.length,
    )

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
