import {
  NotificationInsert,
  NotificationSelect,
  NotificationTable,
} from '@dbs/games-schema'
import { gamesDb } from '@games/services'
import { and, asc, eq, gte, isNull } from 'drizzle-orm'
import { gamesCache } from './cache'
import { gamesPubsubs } from './pubsubs'

export class NotificationService {
  getActual = async (userId?: string): Promise<NotificationSelect[]> => {
    const actual: NotificationSelect[] = []
    const now = new Date().toISOString()

    if (userId) {
      let personal = await gamesCache.personalNotifications.get(userId)

      if (!personal) {
        personal = await gamesDb.query.NotificationTable.findMany({
          where: and(
            eq(NotificationTable.userId, userId),
            gte(NotificationTable.expiresAt, now),
          ),
          orderBy: asc(NotificationTable.createdAt),
        })

        await gamesCache.personalNotifications.set(userId, personal)
      }

      actual.push(...personal)
    }

    let global = await gamesCache.globalNotifications.get()

    if (!global) {
      global = await gamesDb.query.NotificationTable.findMany({
        where: and(
          isNull(NotificationTable.userId),
          gte(NotificationTable.expiresAt, now),
        ),
        orderBy: asc(NotificationTable.createdAt),
      })

      await gamesCache.globalNotifications.set(global)
    }

    actual.push(...global)
    return actual
  }

  send = async (payload: NotificationInsert) => {
    const [notification] = await gamesDb
      .insert(NotificationTable)
      .values(payload)
      .returning()

    if (notification.userId) {
      await gamesCache.personalNotifications.del(notification.userId)
    } else {
      await gamesCache.globalNotifications.del()
    }

    await gamesPubsubs.notifications.publish(notification)
  }
}

export const notificationService = new NotificationService()
