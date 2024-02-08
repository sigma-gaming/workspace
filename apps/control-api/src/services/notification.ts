import { NotificationInsert, Notifications } from '@libs/games-db-schema'
import { db } from '../shared/db'
import { caches, pubsubs } from '../shared/redis'

const send = async (payload: NotificationInsert) => {
  const [notification] = await db
    .insert(Notifications)
    .values(payload)
    .returning()

  if (notification.userId) {
    await caches.personalNotifications.del(notification.userId)
  } else {
    await caches.globalNotifications.del()
  }

  await pubsubs.notifications.publish(notification)
}

export const NotificationService = {
  send,
}
