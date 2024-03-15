import { NotificationSelect } from '@games/db-schema'
import { notificationService, sessionService } from '@games/services'
import { procedure } from '../trpc'

export const getActual = procedure.query(
  async ({ ctx }): Promise<NotificationSelect[]> => {
    const user = sessionService.getUserSafe(ctx.session)
    return notificationService.getActual(user?.id)
  },
)
