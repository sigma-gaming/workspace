import { profileService } from '@games/services'
import { createRouter } from '../../app/router'

export const getDetailedProfileRoute = createRouter().get('/', async (ctx) => {
  const { userId } = ctx.get('session')
  const profile = await profileService.getDetailedProfile(userId)
  return ctx.json(profile)
})
