import { InternalServerException, NotFoundException } from '@core/exceptions'
import { takeFirstOrThrow } from '@core/utils'
import {
  AccountSelect,
  AccountTable,
  ProfileTable,
  UserTable,
} from '@dbs/games-schema'
import { UserDetails } from '@games/model'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { gamesCache } from './cache'

export class ProfileService {
  private async queryUserDetails(userId: string) {
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

    const { user, profile } = takeFirstOrThrow(joins)

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

    const userDetails: UserDetails = {
      profile,
      user,
      accounts,
    }

    return userDetails
  }

  async getUserDetails(userId: string): Promise<UserDetails> {
    if (!gamesCache.ready) {
      return this.queryUserDetails(userId)
    }

    const cached = await gamesCache.userDetails.get(userId)
    if (cached) return cached

    const userDetails = await this.queryUserDetails(userId)
    await gamesCache.userDetails.set(userId, userDetails)
    return userDetails
  }
}

export const profileService = new ProfileService()
