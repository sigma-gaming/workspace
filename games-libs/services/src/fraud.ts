import { createSingletonProxy } from '@core/di'
import { HonoUwsContext } from '@core/hono-uws'
import { gamesDb } from '@dbs/games-db'
import { UserSecurityTable } from '@dbs/games-schema'
import { count, eq } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'

export enum FraudLevel {
  Clear = 'Clear',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

@singleton()
export class FraudService {
  actualizeIP = async (ctx: HonoUwsContext, userId: string) => {
    await gamesDb
      .update(UserSecurityTable)
      .set({ lastIP: ctx.env.getIP() })
      .where(eq(UserSecurityTable.userId, userId))
  }

  calculateFraudLevel = async (userId: string): Promise<FraudLevel> => {
    const security = await gamesDb.query.UserSecurityTable.findFirst({
      where: eq(UserSecurityTable.userId, userId),
    })

    if (!security) {
      return FraudLevel.Clear
    }

    if (!security.lastIP) {
      return FraudLevel.Clear
    }

    const [{ count: sameIpCount }] = await gamesDb
      .select({ count: count() })
      .from(UserSecurityTable)
      .where(eq(UserSecurityTable.lastIP, security.lastIP))

    if (sameIpCount > 3) {
      return FraudLevel.High
    }

    return FraudLevel.Clear
  }
}

export const fraudService = createSingletonProxy(FraudService)
