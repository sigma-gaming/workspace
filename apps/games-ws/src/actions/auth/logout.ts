import { NotAuthenticatedException } from '@core/exceptions'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'

export const LogoutAction = createWsAction({
  name: 'auth/logout',
  async handler(ctx): Promise<void> {
    const { session } = ctx

    if (!session) {
      throw new NotAuthenticatedException()
    }

    ctx.session = null
    ctx.socket.leave(userRoom(session.userId))
  },
})
