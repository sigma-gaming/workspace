import { Notification } from '@libs/games-db-schema'
import { NotificationService } from '../../services/notification'
import { SessionService } from '../../services/session'
import { procedure } from '../trpc'

export const getActual = procedure.query(
  async ({ ctx }): Promise<Notification[]> => {
    const user = SessionService.getUserSafe(ctx.session)
    return NotificationService.getActual(user?.id)
  },
)
