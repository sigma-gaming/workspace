import { UserStatsSelect, UserStatsTable } from '@dbs/games-schema'
import { gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'

export class UserStatsService {
  private async queryStats(userId: string) {
    const stats = await gamesDb.query.UserStatsTable.findFirst({
      where: eq(UserStatsTable.userId, userId),
    })

    return stats ?? null
  }

  async getStats(userId: string): Promise<UserStatsSelect> {
    const stats = await this.queryStats(userId)
    if (!stats) throw new Error('User stats not found (should not happen)')
    return stats
  }
}

export const userStatsService = new UserStatsService()
