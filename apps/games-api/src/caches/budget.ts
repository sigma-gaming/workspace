import { Budget } from '@libs/games-db'
import { cache } from '../shared/redis'

export const budgetCache = cache.entity<void, Budget>({
  keygen: () => `global:budget`,
  options: {
    ttl: 60 * 60 * 24, // 1 day
  },
})
