import { Notification, Notifications } from '@libs/games-db-schema'
import { and, asc, eq, gte, isNull, or } from 'drizzle-orm'
import { SessionService } from '../../services/session'
import { db } from '../../shared/db'
import { procedure } from '../trpc'

export const getActual = procedure.query(
  async ({ ctx }): Promise<Notification[]> => {
    const user = SessionService.getUserSafe(ctx.session)

    const userIdFilter = user
      ? or(isNull(Notifications.userId), eq(Notifications.userId, user.id))
      : isNull(Notifications.userId)

    return await db.query.Notifications.findMany({
      where: and(
        userIdFilter,
        gte(Notifications.expiresAt, new Date().toISOString()),
      ),
      orderBy: asc(Notifications.createdAt),
    })
  },
)
