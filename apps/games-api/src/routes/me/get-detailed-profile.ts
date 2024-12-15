import { profileService, sessionService } from '@games/services'
import { createRouter } from '../../app/router'

export const getDetailedProfileRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const profile = await profileService.getDetailedProfile(userId)
  return ctx.json(profile)
})
