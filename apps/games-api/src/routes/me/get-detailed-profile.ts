import { profileService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getDetailedProfileRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const profile = await profileService.getDetailedProfile(user.id, { user })
  return ctx.json(profile)
})
