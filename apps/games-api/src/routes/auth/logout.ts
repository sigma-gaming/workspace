import { SessionService } from '../../services/session'
import { procedure } from '../trpc'

export const logout = procedure.mutation(async ({ ctx }) => {
  const { res, session } = ctx

  const { cookie } = await SessionService.removeSession(session)

  res.header('Set-Cookie', cookie)
  return { status: 'ok' }
})
