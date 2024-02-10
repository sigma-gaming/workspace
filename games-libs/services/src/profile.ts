import { createSingletonProxy } from '@libs/di'
import { NotFoundException } from '@libs/exceptions'
import { gamesDb } from '@games/db'
import {
  Account,
  Accounts,
  Profile,
  Profiles,
  User,
} from '@games/db-schema'
import { getFullName, ProfileDetailed } from '@games/model'
import { gamesCaches } from '@games/redis'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe'

interface Reused {
  profile?: Profile
  accounts?: Account[]
}

@singleton()
export class ProfileService {
  async getDetailedProfile(
    user: User,
    reused?: Reused,
  ): Promise<ProfileDetailed> {
    const cached = await gamesCaches.detailedProfile.get(user.id)

    if (cached) {
      return cached
    }

    const profile =
      reused?.profile ??
      (await gamesDb.query.Profiles.findFirst({
        where: eq(Profiles.userId, user.id),
      }))

    const accounts =
      reused?.accounts ??
      (await gamesDb.query.Accounts.findMany({
        where: eq(Accounts.userId, user.id),
      }))

    if (!profile) {
      throw new NotFoundException()
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

    const detailedProfile: ProfileDetailed = {
      ...profile,
      name: calculateName(),
      image: profileAccount?.providerUserImage ?? null,
      accounts,
    }

    await gamesCaches.detailedProfile.set(user.id, detailedProfile)

    return detailedProfile
  }
}

export const profileService = createSingletonProxy(ProfileService)
