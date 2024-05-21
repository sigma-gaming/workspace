import { sessionService } from '@games/services'
import { procedure } from '../trpc'

export const logout = procedure.mutation(async ({ ctx }) => {
  const { res, session } = ctx

  const { cookie } = await sessionService.removeSession(session)

  res.header('Set-Cookie', cookie)
  return { status: 'success' }
})
