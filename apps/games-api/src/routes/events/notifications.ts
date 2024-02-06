import { NotificationsQueuePayload } from '@libs/games-queue'
import { observable, Observer } from '@trpc/server/observable'
import { SessionService } from '../../services/session'
import { pubsubs } from '../../shared/redis'
import { procedure } from '../trpc'

type NotificationContent = NotificationsQueuePayload['content']

pubsubs.notifications.subscribe((payload) => {
  if (payload.target.type === 'global') {
    emitToAll(payload.content)
  } else if (payload.target.type === 'personal') {
    emitToUser(payload.target.userId, payload.content)
  }
})

const observersByUserId = new Map<
  string,
  Observer<NotificationContent, unknown>[]
>()

function registerObserver(
  userId: string,
  observer: Observer<NotificationContent, unknown>,
) {
  const observers = observersByUserId.get(userId) ?? []
  observersByUserId.set(userId, [...observers, observer])
}

function unregisterObserver(
  userId: string,
  observer: Observer<NotificationContent, unknown>,
) {
  const observers = observersByUserId.get(userId) ?? []

  observersByUserId.set(
    userId,
    observers.filter((item) => item !== observer),
  )
}

function emitToUser(userId: string, content: NotificationContent) {
  const observers = observersByUserId.get(userId) ?? []
  observers.forEach((observer) => observer.next(content))
}

function emitToAll(content: NotificationContent) {
  observersByUserId.forEach((observers) => {
    observers.forEach((observer) => observer.next(content))
  })
}

export const notifications = procedure.subscription(({ ctx }) => {
  const user = SessionService.getUserSafe(ctx.session)
  const userId = user?.id ?? 'anonymous'

  return observable<NotificationContent>((observer) => {
    registerObserver(userId, observer)

    return () => {
      unregisterObserver(userId, observer)
    }
  })
})
