import { ProfileDetailed } from '@libs/games-model'
import { ProfileService } from '../../services/profile'
import { SessionService } from '../../services/session'
import { procedure } from '../trpc'

export const getDetailedProfile = procedure.query(
  async ({ ctx }): Promise<ProfileDetailed> => {
    const user = SessionService.getUser(ctx.session)

    return ProfileService.getDetailedProfile(user)
  },
)
