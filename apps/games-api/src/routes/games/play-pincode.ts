import { limitByIp, zValidator } from '@core/server'
import { Engine, PincodePayloadSchema } from '@games/engine'
import { sessionService } from '@games/services'
import { createRouter } from '../../app/router'

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

    // ctx.socket.to(userRoom(session.userId)).emit('balance/updated', {
    //   available: updatedBalance,
    // })

    return ctx.json({ record, updatedBalance })
  },
)
