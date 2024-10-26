import { NotAuthenticatedException } from '@core/exceptions'
import { Engine, PincodePayloadSchema, PlayPincodeOutput } from '@games/engine'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'

export const GamesPincodeAction = createWsAction({
  name: 'games/pincode',
  schema: PincodePayloadSchema,
  async handler(ctx, payload): Promise<PlayPincodeOutput> {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    const { record, updatedBalance } = await Engine.playPincode({
      userId: session.userId,
      payload,
    })

    ctx.socket.to(userRoom(session.userId)).emit('balance/updated', {
      available: updatedBalance,
    })

    return { record, updatedBalance }
  },
})
