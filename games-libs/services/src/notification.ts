import { gamesDb } from '@games/db'
import {
  Notification,
  NotificationInsert,
  Notifications,
} from '@games/db-schema'
import { gamesCaches, gamesPubsubs } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import { and, asc, eq, gte, isNull } from 'drizzle-orm'
import { singleton } from 'tsyringe'

@singleton()
export class NotificationService {
  getActual = async (userId?: string): Promise<Notification[]> => {
    const actual: Notification[] = []
    const now = new Date().toISOString()

    if (userId) {
      let personal = await gamesCaches.personalNotifications.get(userId)

      if (!personal) {
        personal = await gamesDb.query.Notifications.findMany({
          where: and(
            eq(Notifications.userId, userId),
            gte(Notifications.expiresAt, now),
          ),
          orderBy: asc(Notifications.createdAt),
        })

        await gamesCaches.personalNotifications.set(userId, personal)
      }

      actual.push(...personal)
    }

    let global = await gamesCaches.globalNotifications.get()

    if (!global) {
      global = await gamesDb.query.Notifications.findMany({
        where: and(
          isNull(Notifications.userId),
          gte(Notifications.expiresAt, now),
        ),
        orderBy: asc(Notifications.createdAt),
      })

      await gamesCaches.globalNotifications.set(global)
    }

    actual.push(...global)
    return actual
  }

  send = async (payload: NotificationInsert) => {
    const [notification] = await gamesDb
      .insert(Notifications)
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
