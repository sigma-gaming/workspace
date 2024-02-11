import { gamesDb } from '@games/db'
import {
  Account,
  Accounts,
  Profile,
  Profiles,
  User,
  Users,
} from '@games/db-schema'
import { getFullName, ProfileDetailed } from '@games/model'
import { gamesCaches } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { InternalServerException, NotFoundException } from '@libs/exceptions'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe'

interface Reused {
  user?: User
  profile?: Profile
  accounts?: Account[]
}

@singleton()
export class ProfileService {
  async getDetailedProfile(
    userId: User['id'],
    reused?: Reused,
  ): Promise<ProfileDetailed> {
    const cached = await gamesCaches.detailedProfile.get(userId)

    if (cached) {
      return cached
    }

    const user =
      reused?.user ??
      (await gamesDb.query.Users.findFirst({
        where: eq(Users.id, userId),
      }))

    const profile =
      reused?.profile ??
      (await gamesDb.query.Profiles.findFirst({
        where: eq(Profiles.userId, userId),
      }))

    const accounts =
      reused?.accounts ??
      (await gamesDb.query.Accounts.findMany({
        where: eq(Accounts.userId, userId),
      }))

    if (!user || !profile) {
      throw new NotFoundException()
    }

    const profileAccount = accounts.find(
      (account) => account.provider === profile.usedProvider,
    )

    if (!profileAccount) {
      throw new InternalServerException()
    }

    const calculateName = () => {
      if (profile.name) return profile.name

      return getFullName(
        profileAccount.providerUserFirstName,
        profileAccount.providerUserLastName,
      )
    }

    const detailedProfile: ProfileDetailed = {
      ...profile,
      name: calculateName(),
      image: profileAccount?.providerUserImage ?? null,
      roles: user.roles,
      accounts,
    }

    await gamesCaches.detailedProfile.set(userId, detailedProfile)

    return detailedProfile
  }
}

export const profileService = createSingletonProxy(ProfileService)
