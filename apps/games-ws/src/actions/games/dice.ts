import { NotAuthenticatedException } from '@core/exceptions'
import { DicePayloadSchema, Engine } from '@games/engine'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'

export const GamesDiceAction = createWsAction({
  name: 'games/dice',
  schema: DicePayloadSchema,
  async handler(ctx, payload) {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    const { record, updatedBalance } = await Engine.playDice({
      userId: session.userId,
      payload,
    })

    ctx.socket.to(userRoom(session.userId)).emit('balance/updated', {
      available: updatedBalance,
    })

    return { record, updatedBalance }
  },
})
