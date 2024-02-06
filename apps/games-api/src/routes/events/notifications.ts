import { NotificationsQueuePayload } from '@libs/games-queue'
import { observable } from '@trpc/server/observable'
import { notificationsEvents } from '../../events/notifications'
import { SessionService } from '../../services/session'
import { queues } from '../../shared/queue'
import { procedure } from '../trpc'

type NotificationContent = NotificationsQueuePayload['content']

queues.notifications.createConsumer({
  concurrency: 1,
  handler(payload) {
    notificationsEvents.emit('received', payload)
    return { sent: true }
  },
})

export const notifications = procedure.subscription(({ ctx }) => {
  const user = SessionService.getUser(ctx.session)

  return observable<NotificationContent>((emit) => {
    const { unsubscribe } = notificationsEvents.subscribe(
      'received',
      (payload) => {
        if (payload.target.type === 'global') {
          return emit.next(payload.content)
        }

        if (
          payload.target.type === 'personal' &&
          payload.target.userId === user.id
        ) {
          return emit.next(payload.content)
        }
      },
    )

    return unsubscribe
  })
})
