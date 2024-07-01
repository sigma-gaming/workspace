import { profileService, sessionService } from '@games/services'
import { Hono } from 'hono'

export const getDetailedProfileRoute = new Hono().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx.req)
  const user = sessionService.getUser(session)
  const profile = await profileService.getDetailedProfile(user.id, { user })
  return ctx.json(profile)
})
