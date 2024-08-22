import { NotAuthenticatedException } from '@core/exceptions'
import { Engine, PincodePayloadSchema, PlayPincodeOutput } from '@games/engine'
import { Context } from '../../context'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'

export const GamesPincodeAction = createWsAction({
  name: 'games/pincode',
  schema: PincodePayloadSchema,
  async handler(ctx: Context, payload): Promise<PlayPincodeOutput> {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    const { record, updatedBalance } = await Engine.playPincode({
      userId: session.user.id,
      payload,
    })

    ctx.socket.to(userRoom(session.user.id)).emit('balance/updated', {
      available: updatedBalance,
    })

    return { record, updatedBalance }
  },
})
