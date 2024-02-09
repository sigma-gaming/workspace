import { z } from 'zod'
import { maintenanceCache } from '../../shared/redis'
import { procedure } from '../trpc'

export const updateMaintenance = procedure
  .input(
    z.object({
      value: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    await maintenanceCache.setMaintenanceMode(input.value)

    return { status: 'success', maintenanceMode: input.value }
  })
