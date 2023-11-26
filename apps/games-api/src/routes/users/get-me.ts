import { SessionService } from '../../services/session'
import { procedure } from '../trpc'

export const getMe = procedure.query(async ({ ctx }) => {
  return { user: SessionService.getUser(ctx.session) }
})
