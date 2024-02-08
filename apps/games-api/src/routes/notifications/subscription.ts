import { Notification } from '@libs/games-db-schema'
import { observable, Observer } from '@trpc/server/observable'
import { SessionService } from '../../services/session'
import { pubsubs } from '../../shared/redis'
import { procedure } from '../trpc'

pubsubs.notifications.subscribe((notification) => {
  if (notification.userId) {
    emitToUser(notification.userId, notification)
  } else {
    emitToAll(notification)
  }
})

const observersByUserId = new Map<string, Observer<Notification, unknown>[]>()

function registerObserver(
  userId: string,
  observer: Observer<Notification, unknown>,
) {
  const observers = observersByUserId.get(userId) ?? []
  observersByUserId.set(userId, [...observers, observer])
}

function unregisterObserver(
  userId: string,
  observer: Observer<Notification, unknown>,
) {
  const observers = observersByUserId.get(userId) ?? []

  observersByUserId.set(
    userId,
    observers.filter((item) => item !== observer),
  )
}

function emitToUser(userId: string, notification: Notification) {
  const observers = observersByUserId.get(userId) ?? []
  observers.forEach((observer) => observer.next(notification))
}

function emitToAll(notification: Notification) {
  observersByUserId.forEach((observers) => {
    observers.forEach((observer) => observer.next(notification))
  })
}

export const subscription = procedure.subscription(({ ctx }) => {
  const user = SessionService.getUserSafe(ctx.session)
  const userId = user?.id ?? 'anonymous'

  return observable<Notification>((observer) => {
    registerObserver(userId, observer)
    return () => unregisterObserver(userId, observer)
  })
})
