import { Budget, Notification, Transaction } from '@libs/games-db-schema'
import { ProfileDetailed, Session } from '@libs/games-model'
import { Cache } from './cache'

export function createCaches(
  options: { version: string },
  dependencies: { cache: Cache },
) {
  const { version } = options
  const { cache } = dependencies

  const budget = cache.entity<void, Budget>({
    keygen: () => `${version}:global:budget`,
    options: {
      ttl: 60 * 60 * 24, // 1 day
    },
  })

  const detailedProfile = cache.entity<string, ProfileDetailed>({
    keygen: (token: string) => `${version}:detailed-profile:${token}`,
  })

  const session = cache.entity<string, Session>({
    keygen: (token: string) => `${version}:session:${token}`,
  })

  const lastTransaction = cache.entity<string, Transaction>({
    keygen: (userId: string) => `${version}:last-transaction:${userId}`,
  })

  const globalNotifications = cache.entity<void, Notification[]>({
    keygen: () => `${version}:global:notifications`,
  })

  const personalNotifications = cache.entity<string, Notification[]>({
    keygen: (userId: string) => `${version}:notifications:${userId}`,
  })

  return {
    budget,
    detailedProfile,
    session,
    lastTransaction,
    globalNotifications,
    personalNotifications,
  }
}
