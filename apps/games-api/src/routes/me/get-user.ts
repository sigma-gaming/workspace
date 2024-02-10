import { User } from '@games/db-schema'
import { sessionService } from '@games/services'
import { procedure } from '../trpc'

export const getUser = procedure.query(async ({ ctx }): Promise<User> => {
  return sessionService.getUser(ctx.session)
})
