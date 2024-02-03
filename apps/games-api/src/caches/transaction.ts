import { Transaction } from '@libs/games-db-schema'
import { cache } from '../shared/cache'

export const lastTransactionCache = cache.entity<string, Transaction>({
  keygen: (userId: string) => `last-transaction:${userId}`,
})
