import { InternalServerException, NotFoundException } from '@core/exceptions'
import {
  AccountSelect,
  AccountTable,
  ProfileTable,
  UserTable,
} from '@dbs/games-schema'
import { ProfileDetailed } from '@games/model'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { gamesCache } from './cache'

export class ProfileService {
  private async queryDetailedProfile(userId: string) {
    const joins = await gamesDb
      .select({
        user: UserTable,
        profile: ProfileTable,
        account: AccountTable,
      })
      .from(UserTable)
      .leftJoin(ProfileTable, eq(UserTable.id, ProfileTable.userId))
      .leftJoin(AccountTable, eq(UserTable.id, AccountTable.userId))
      .where(eq(UserTable.id, userId))

    if (joins.length === 0) {
      throw new NotFoundException()
    }

    const { user, profile } = joins[0]

    if (!profile) {
      throw new NotFoundException()
    }

    const accounts = joins
      .map((join) => join.account)
      .filter((value: unknown): value is AccountSelect => Boolean(value))

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

    return detailedProfile
  }

  async getDetailedProfile(userId: string): Promise<ProfileDetailed> {
    if (!gamesCache.ready) {
      return this.queryDetailedProfile(userId)
    }

    const cached = await gamesCache.detailedProfile.get(userId)
    if (cached) return cached

    const detailedProfile = await this.queryDetailedProfile(userId)
    await gamesCache.detailedProfile.set(userId, detailedProfile)
    return detailedProfile
  }
}

export const profileService = new ProfileService()
