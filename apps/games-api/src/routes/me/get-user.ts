import { User } from '@libs/games-model'
import { SessionService } from '../../services/session'
import { procedure } from '../trpc'

export const getUser = procedure.query(async ({ ctx }): Promise<User> => {
  return SessionService.getUser(ctx.session)
})
