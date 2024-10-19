import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import { UserSelect, UserTable } from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import { eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'

@singleton()
export class UserService {
  async getUserSafe(userId: string): Promise<UserSelect | null> {
    const cached = await gamesCaches.user.get(userId)
    if (cached) return cached

    const user = await gamesDb.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

    if (!user) return null
    await gamesCaches.user.set(userId, user)
    return user
  }

  async getUser(userId: string): Promise<UserSelect> {
    const user = await this.getUserSafe(userId)
    if (!user) throw new Error('User not found')
    return user
  }
}

export const userService = createSingletonProxy(UserService)
