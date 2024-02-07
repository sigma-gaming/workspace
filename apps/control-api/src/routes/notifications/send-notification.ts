import { NotificationContentSchema } from '@libs/games-model'
import { NotificationTargetSchema } from '@libs/games-redis'
import { z } from 'zod'
import { pubsubs } from '../../shared/redis'
import { procedure } from '../trpc'

export const send = procedure
  .input(
    z.object({
      target: NotificationTargetSchema,
      content: NotificationContentSchema,
    }),
  )
  .mutation(async ({ input }) => {
    pubsubs.notifications.publish(input)
  })
