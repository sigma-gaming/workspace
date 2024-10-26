import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { SessionState } from '@games/model'
import { sessionService } from '@games/services'
import { userRoom } from '../../shared/rooms/user'
import { createWsAction } from '../../ws-action'
import { SignInPayloadSchema } from './contracts'

export const SignInAction = createWsAction({
  name: 'auth/sign-in',
  schema: SignInPayloadSchema,
  async handler(ctx, { accessToken }): Promise<void> {
    const sessionVariant = sessionService.getSessionVariant(accessToken)

    if (sessionVariant.state === SessionState.Empty) {
      throw new NotAuthenticatedException()
    }

    if (sessionVariant.state === SessionState.Expired) {
      throw new SessionExpiredException()
    }

    const { session } = sessionVariant

    ctx.session = session
    ctx.socket.join(userRoom(session.userId))
  },
})
