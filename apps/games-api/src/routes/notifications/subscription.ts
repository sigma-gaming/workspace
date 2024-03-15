import { NotificationSelect } from '@games/db-schema'
import { gamesPubsubs } from '@games/redis'
import { sessionService } from '@games/services'
import { observable, Observer } from '@trpc/server/observable'
import { procedure } from '../trpc'

gamesPubsubs.notifications.subscribe((notification) => {
  if (notification.userId) {
    emitToUser(notification.userId, notification)
  } else {
    emitToAll(notification)
  }
})

const observersByUserId = new Map<
  string,
  Observer<NotificationSelect, unknown>[]
>()

function registerObserver(
  userId: string,
  observer: Observer<NotificationSelect, unknown>,
) {
  const observers = observersByUserId.get(userId) ?? []
  observersByUserId.set(userId, [...observers, observer])
}

function unregisterObserver(
  userId: string,
  observer: Observer<NotificationSelect, unknown>,
) {
  const observers = observersByUserId.get(userId) ?? []

  observersByUserId.set(
    userId,
    observers.filter((item) => item !== observer),
  )
}

function emitToUser(userId: string, notification: NotificationSelect) {
  const observers = observersByUserId.get(userId) ?? []
  observers.forEach((observer) => observer.next(notification))
}

function emitToAll(notification: NotificationSelect) {
  observersByUserId.forEach((observers) => {
    observers.forEach((observer) => observer.next(notification))
  })
}

export const subscription = procedure.subscription(({ ctx }) => {
  const user = sessionService.getUserSafe(ctx.session)
  const userId = user?.id ?? 'anonymous'

  return observable<NotificationSelect>((observer) => {
    registerObserver(userId, observer)
    return () => unregisterObserver(userId, observer)
  })
})
