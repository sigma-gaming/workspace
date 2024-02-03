import { GlobalSettings } from '@libs/games-db-schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { maintenanceCache } from '../../caches/maintenance'
import { db } from '../../shared/db'
import { procedure } from '../trpc'

export const updateMaintenance = procedure
  .input(
    z.object({
      value: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    const [{ maintenanceMode }] = await db
      .update(GlobalSettings)
      .set({ maintenanceMode: input.value })
      .where(eq(GlobalSettings.id, 1))
      .returning()

    await maintenanceCache.set(maintenanceMode)

    return { success: true, maintenanceMode }
  })
