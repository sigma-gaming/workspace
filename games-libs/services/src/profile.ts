import { gamesDb } from '@games/db'
import {
  AccountSelect,
  AccountTable,
  ProfileSelect,
  ProfileTable,
  UserSelect,
  UserTable,
} from '@games/db-schema'
import { getUserFullName, ProfileDetailed } from '@games/model'
import { gamesCaches } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { InternalServerException, NotFoundException } from '@libs/exceptions'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe'

interface Reused {
  user?: UserSelect
  profile?: ProfileSelect
  accounts?: AccountSelect[]
}

@singleton()
export class ProfileService {
  async getDetailedProfile(
    userId: UserSelect['id'],
    reused?: Reused,
  ): Promise<ProfileDetailed> {
    const cached = await gamesCaches.detailedProfile.get(userId)

    if (cached) {
      return cached
    }

    const user =
      reused?.user ??
      (await gamesDb.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
      }))

    const profile =
      reused?.profile ??
      (await gamesDb.query.ProfileTable.findFirst({
        where: eq(ProfileTable.userId, userId),
      }))

    const accounts =
      reused?.accounts ??
      (await gamesDb.query.AccountTable.findMany({
        where: eq(AccountTable.userId, userId),
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

      return getUserFullName(
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
