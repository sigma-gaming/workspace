import { UserSelect, UserTable } from '@dbs/games-schema'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { gamesCache } from './cache'

export class UserService {
  async getUserSafe(userId: string): Promise<UserSelect | null> {
    const cached = await gamesCache.user.get(userId)
    if (cached) return cached

    const user = await gamesDb.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

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
