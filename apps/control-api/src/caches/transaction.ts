import { Transaction } from '@libs/games-db-schema'
import { cache } from '../shared/redis'

export const lastTransactionCache = cache.entity<string, Transaction>({
  keygen: (userId: string) => `last-transaction:${userId}`,
})
