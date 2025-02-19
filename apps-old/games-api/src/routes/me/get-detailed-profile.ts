import { profileService, sessionService } from '@games/services'
import { createRouter } from '../../app/router'

export const getUserDetailsRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)
  const profile = await profileService.getUserDetails(userId)
  return ctx.json(profile)
})
