import { NotificationSchema } from '@games/model'
import { notificationService } from '@games/services'
import { procedure } from '../trpc'

export const send = procedure
  .input(NotificationSchema)
  .mutation(async ({ input }) => {
    await notificationService.send(input)
  })
