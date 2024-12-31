import { PincodeMode } from '@dbs/games-types'
import { Engine } from '@games/engine'
import { BalanceUpdate, gemInt, UpdateMode } from '@games/model'
import { gamesPubsubs, sessionService } from '@games/services'
import { tbValidator } from '@hono/typebox-validator'
import { Type as T } from '@sinclair/typebox'
import { createRouter } from '../../app/router'
import { metrics, updateBetMetrics } from '../../metrics'
import { limitByIp } from '../../middlewares/rate-limit'

export const PincodePayloadSchema = T.Object(
  {
    bet: T.Integer({
      minimum: gemInt(1),
      maximum: gemInt(5000),
      errorMessage: {
        minimum: 'Минимальная ставка - 1 гем',
        maximum: 'Максимальная ставка - 5000 гемов',
      },
    }),
    mode: T.Enum(PincodeMode),
  },
  { additionalProperties: false },
)

export const playPincode = createRouter().post(
  '/',
  limitByIp({ limit: 15, windowMs: 10 * 1000 }),
  tbValidator('json', PincodePayloadSchema),
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
