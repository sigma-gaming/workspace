import { getFullName, UserDetailed } from '@libs/games-model'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const getDetailedUser = procedure.query(
  async ({ ctx }): Promise<UserDetailed> => {
    const user = SessionService.getUser(ctx.session)

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    })

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    })

    if (!profile) {
      return { ...user, accounts, profile }
    }

    const profileAccount = accounts.find(
      (account) => account.provider === profile.usedProvider,
    )

    const calculateName = () => {
      if (profile.name) return profile.name
      if (!profileAccount) return null

      return getFullName(
        profileAccount.providerUserFirstName,
        profileAccount.providerUserLastName,
      )
    }

    return {
      ...user,
      accounts,
      profile: {
        ...profile,
        name: calculateName(),
        image: profileAccount?.providerUserImage ?? null,
      },
    }
  },
)
