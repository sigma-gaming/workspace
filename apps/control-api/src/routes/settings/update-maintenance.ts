import { z } from 'zod'
import { maintenanceCache } from '../../caches/maintenance'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const updateMaintenance = procedure
  .input(
    z.object({
      value: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    const { maintenanceMode } = await prisma.globalSettings.update({
      where: { id: 1 },
      data: { maintenanceMode: input.value },
    })

    await maintenanceCache.set(maintenanceMode)

    return { success: true, maintenanceMode }
  })
