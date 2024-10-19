import { createSingletonProxy } from '@core/di'
import { InternalServerException, NotFoundException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import {
  AccountSelect,
  AccountTable,
  ProfileSelect,
  ProfileTable,
  UserSelect,
} from '@dbs/games-schema'
import { ProfileDetailed } from '@games/model'
import { gamesCaches } from '@games/redis'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'
import { userService } from './user'

type Reused = {
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

    await gamesCaches.detailedProfile.set(userId, detailedProfile)

    return detailedProfile
  }
}

export const profileService = createSingletonProxy(ProfileService)
