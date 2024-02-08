import { NotificationSchema } from '@libs/games-model'
import { NotificationService } from '../../services/notification'
import { procedure } from '../trpc'

export const send = procedure
  .input(NotificationSchema)
  .mutation(async ({ input }) => {
    await NotificationService.send(input)
  })
