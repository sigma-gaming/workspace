import { InternalServerException, NotFoundException } from '@core/exceptions'
import {
  AccountSelect,
  AccountTable,
  ProfileSelect,
  ProfileTable,
  UserSelect,
} from '@dbs/games-schema'
import { ProfileDetailed } from '@games/model'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { gamesCache } from './cache'
import { userService } from './user'

type Reused = {
  user?: UserSelect
  profile?: ProfileSelect
  accounts?: AccountSelect[]
}

export class ProfileService {
  async getDetailedProfile(
    userId: UserSelect['id'],
    reused?: Reused,
  ): Promise<ProfileDetailed> {
    const cached = await gamesCache.detailedProfile.get(userId)

    if (cached) {
      return cached
    }

    const user = reused?.user ?? (await userService.getUserSafe(userId))

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

    const detailedProfile: ProfileDetailed = {
      ...profile,
      roles: user.roles,
      accounts,
    }

    await gamesCache.detailedProfile.set(userId, detailedProfile)

    return detailedProfile
  }
}

export const profileService = new ProfileService()
