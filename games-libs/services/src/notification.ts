import { gamesDb } from '@dbs/games-db'
import {
  NotificationInsert,
  NotificationSelect,
  NotificationTable,
} from '@dbs/games-schema'
import { gamesCaches, gamesPubsubs } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { and, asc, eq, gte, isNull } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class NotificationService {
  getActual = async (userId?: string): Promise<NotificationSelect[]> => {
    const actual: NotificationSelect[] = []
    const now = new Date().toISOString()

    if (userId) {
      let personal = await gamesCaches.personalNotifications.get(userId)

      if (!personal) {
        personal = await gamesDb.query.NotificationTable.findMany({
          where: and(
            eq(NotificationTable.userId, userId),
            gte(NotificationTable.expiresAt, now),
          ),
          orderBy: asc(NotificationTable.createdAt),
        })

        await gamesCaches.personalNotifications.set(userId, personal)
      }

      actual.push(...personal)
    }

    let global = await gamesCaches.globalNotifications.get()

    if (!global) {
      global = await gamesDb.query.NotificationTable.findMany({
        where: and(
          isNull(NotificationTable.userId),
          gte(NotificationTable.expiresAt, now),
        ),
        orderBy: asc(NotificationTable.createdAt),
      })

      await gamesCaches.globalNotifications.set(global)
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
      await gamesCaches.personalNotifications.del(notification.userId)
    } else {
      await gamesCaches.globalNotifications.del()
    }

    await gamesPubsubs.notifications.publish(notification)
  }
}

export const notificationService = createSingletonProxy(NotificationService)
