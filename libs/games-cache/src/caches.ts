import { Budget, Transaction } from '@libs/games-db-schema'
import { ProfileDetailed, Session } from '@libs/games-model'
import { Cache } from './cache'

interface Options {
  version: string
}

export function createCaches(cache: Cache, { version }: Options) {
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

  return {
    budget,
    detailedProfile,
    session,
    lastTransaction,
  }
}
