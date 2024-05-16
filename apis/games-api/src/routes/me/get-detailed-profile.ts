import { ProfileDetailed } from '@games/model'
import { profileService, sessionService } from '@games/services'
import { procedure } from '../trpc'

export const getDetailedProfile = procedure.query(
  async ({ ctx }): Promise<ProfileDetailed> => {
    const user = sessionService.getUser(ctx.session)
    return profileService.getDetailedProfile(user.id, { user })
  },
)
