import { tbValidator, TypeboxError } from '@core/server'
import { PincodeMode } from '@dbs/games-types'
import { Engine } from '@games/engine'
import { BalanceUpdate, gemInt, UpdateMode } from '@games/model'
import { gamesPubsubs, sessionService } from '@games/services'
import { Type } from '@sinclair/typebox'
import { createRouter } from '../../app/router'
import { metrics, updateBetMetrics } from '../../metrics'
import { limitByIp } from '../../middlewares/rate-limit'

const PincodePayloadSchema = Type.Object(
  {
    bet: Type.Integer({
      minimum: gemInt(1),
      maximum: gemInt(5000),
    }),
    mode: Type.Enum(PincodeMode),
  },
  { additionalProperties: false },
)

export const playPincode = createRouter().post(
  '/',
  limitByIp({ limit: 15, windowMs: 10 * 1000 }),
  tbValidator('json', PincodePayloadSchema, {
    bet: {
      [TypeboxError.IntegerMinimum]: 'Минимальная ставка - 1 гем',
      [TypeboxError.IntegerMaximum]: 'Максимальная ставка - 5000 гемов',
    },
  }),
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
      userId,
      mode: UpdateMode.Optimized,
      data: { available: updatedBalance },
    }

    gamesPubsubs.balanceUpdated.publish(balance)

    return ctx.json({
      record,
      balance,
    })
  },
)
