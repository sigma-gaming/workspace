import { UserSelect, UserTable } from '@dbs/games-schema'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { gamesCache } from './cache'

export class UserService {
  private async queryUser(userId: string) {
    const user = await gamesDb.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

    return user ?? null
  }

  async getUserSafe(userId: string) {
    if (!gamesCache.ready) {
      return this.queryUser(userId)
    }

    const cached = await gamesCache.user.get(userId)
    if (cached) return cached

    const user = await this.queryUser(userId)
    if (!user) return null

    await gamesCache.user.set(userId, user)
    return user
  }

  async getUser(userId: string): Promise<UserSelect> {
    const user = await this.getUserSafe(userId)
    if (!user) throw new Error('User not found')
    return user
  }
}

export const userService = new UserService()
