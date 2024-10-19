import { profileService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getDetailedProfileRoute = createRouter().get('/', async (ctx) => {
  const { userId } = sessionService.getHonoSession(ctx)
  const profile = await profileService.getDetailedProfile(userId)
  return ctx.json(profile)
})
