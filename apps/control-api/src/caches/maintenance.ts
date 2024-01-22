import { cache } from '../shared/redis'

export const maintenanceCache = cache.entity<void, boolean>({
  keygen: () => `global:maintenance`,
  options: { ttl: Infinity },
})
