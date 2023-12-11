import { UserDetailed } from '@libs/games-model'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const getMe = procedure.query(async ({ ctx }): Promise<UserDetailed> => {
  const user = SessionService.getUser(ctx.session)

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  })

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
  })

  return { ...user, profile, accounts }
})
