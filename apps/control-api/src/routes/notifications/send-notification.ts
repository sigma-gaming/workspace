import {
  NotificationContentSchema,
  NotificationTargetSchema,
} from '@libs/games-queue'
import { z } from 'zod'
import { queues } from '../../shared/queue'
import { procedure } from '../trpc'

export const send = procedure
  .input(
    z.object({
      target: NotificationTargetSchema,
      content: NotificationContentSchema,
    }),
  )
  .mutation(async ({ input }) => {
    queues.notifications.send(input)
  })
