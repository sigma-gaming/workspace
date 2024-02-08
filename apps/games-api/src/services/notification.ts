import { Notification, Notifications } from '@libs/games-db-schema'
import { and, asc, eq, gte, isNull } from 'drizzle-orm'
import { db } from '../shared/db'
import { caches } from '../shared/redis'

const getActual = async (userId?: string): Promise<Notification[]> => {
  const actual: Notification[] = []
  const now = new Date().toISOString()

  if (userId) {
    let personal = await caches.personalNotifications.get(userId)

    if (!personal) {
      personal = await db.query.Notifications.findMany({
        where: and(
          eq(Notifications.userId, userId),
          gte(Notifications.expiresAt, now),
        ),
        orderBy: asc(Notifications.createdAt),
      })

      await caches.personalNotifications.set(userId, personal)
    }

    actual.push(...personal)
  }

  let global = await caches.globalNotifications.get()

  if (!global) {
    global = await db.query.Notifications.findMany({
      where: and(
        isNull(Notifications.userId),
        gte(Notifications.expiresAt, now),
      ),
      orderBy: asc(Notifications.createdAt),
    })

    await caches.globalNotifications.set(global)
  }

  actual.push(...global)
  return actual
}

export const NotificationService = {
  getActual,
}
