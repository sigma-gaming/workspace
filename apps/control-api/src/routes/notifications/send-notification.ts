import { Notifications } from '@libs/games-db-schema'
import { NotificationSchema } from '@libs/games-model'
import { db } from '../../shared/db'
import { pubsubs } from '../../shared/redis'
import { procedure } from '../trpc'

export const send = procedure
  .input(NotificationSchema)
  .mutation(async ({ input }) => {
    const [notification] = await db
      .insert(Notifications)
      .values(input)
      .returning()

    pubsubs.notifications.publish(notification)
  })
