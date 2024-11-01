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
  private async queryPersonal(userId: string) {
    const now = new Date().toISOString()

    return gamesDb.query.NotificationTable.findMany({
      where: and(
        eq(NotificationTable.userId, userId),
        gte(NotificationTable.expiresAt, now),
      ),
      orderBy: asc(NotificationTable.createdAt),
    })
  }

  private async queryGlobal() {
    const now = new Date().toISOString()

    return await gamesDb.query.NotificationTable.findMany({
      where: and(
        isNull(NotificationTable.userId),
        gte(NotificationTable.expiresAt, now),
      ),
      orderBy: asc(NotificationTable.createdAt),
    })
  }

  private async getPersonal(userId: string) {
    if (!gamesCache.ready) {
      return this.queryPersonal(userId)
    }

    const cached = await gamesCache.personalNotifications.get(userId)
    if (cached) return cached

    const personal = await this.queryPersonal(userId)
    await gamesCache.personalNotifications.set(userId, personal)
    return personal
  }

  private async getGlobal() {
    if (!gamesCache.ready) {
      return this.queryGlobal()
    }

    const cached = await gamesCache.globalNotifications.get()
    if (cached) return cached

    const global = await this.queryGlobal()
    await gamesCache.globalNotifications.set(global)
    return global
  }

  getActual = async (userId?: string): Promise<NotificationSelect[]> => {
    const actual: NotificationSelect[] = []

    if (userId) {
      const personal = await this.getPersonal(userId)
      actual.push(...personal)
    }

    const global = await this.getGlobal()
    actual.push(...global)
    return actual
  }

  send = async (payload: NotificationInsert) => {
    const [notification] = await gamesDb
      .insert(NotificationTable)
      .values(payload)
      .returning()

    if (gamesCache.ready) {
      if (notification.userId) {
        await gamesCache.personalNotifications.del(notification.userId)
      } else {
        await gamesCache.globalNotifications.del()
      }

      await gamesPubsubs.notifications.publish(notification)
    }
  }
}

export const notificationService = new NotificationService()
