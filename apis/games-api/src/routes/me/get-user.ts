import { UserSelect } from '@dbs/games-schema'
import { sessionService } from '@games/services'
import { procedure } from '../trpc'

export const getUser = procedure.query(async ({ ctx }): Promise<UserSelect> => {
  return sessionService.getUser(ctx.session)
})
