import { tbValidator, TypeboxError } from '@core/server'
import { GameSnapshotDice } from '@dbs/games-types'
import { Engine } from '@games/engine'
import { BalanceUpdate, gemInt, UpdateMode } from '@games/model'
import { gamesPubsubs, sessionService } from '@games/services'
import { Type } from '@sinclair/typebox'
import { createRouter } from '../../app/router'
import { metrics, updateBetMetrics } from '../../metrics'
import { limitByIp } from '../../middlewares/rate-limit'

const DicePayloadSchema = Type.Object(
  {
    bet: Type.Integer({
      minimum: gemInt(1),
      maximum: gemInt(5000),
    }),
    sides: Type.Array(
      Type.Integer({
        minimum: 1,
        maximum: 6,
      }),
      {
        minItems: 1,
        maxItems: 5,
      },
    ),
  },
  { additionalProperties: false },
)

export const playDice = createRouter().post(
  '/',
  limitByIp({ limit: 15, windowMs: 10 * 1000 }),
  tbValidator('json', DicePayloadSchema, {
    bet: {
      [TypeboxError.IntegerMinimum]: 'Минимальная ставка - 1 гем',
      [TypeboxError.IntegerMaximum]: 'Максимальная ставка - 5000 гемов',
    },
  }),
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
