import { profileService } from '@games/services'
import { createRouter } from '../../app/router'

export const getUserDetailsRoute = createRouter().get('/', async (ctx) => {
  const { userId } = ctx.get('session')
  const profile = await profileService.getUserDetails(userId)
  return ctx.json(profile)
})
