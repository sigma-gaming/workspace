import { GlobalSettings } from '@libs/games-db-schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { maintenanceCache } from '../../shared/cache'
import { db } from '../../shared/db'
import { procedure } from '../trpc'

export const updateMaintenance = procedure
  .input(
    z.object({
      value: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    const currentSettings = await db.query.GlobalSettings.findFirst()

    let maintenanceMode: boolean

    if (!currentSettings) {
      const [settings] = await db
        .insert(GlobalSettings)
        .values({ maintenanceMode: input.value })
        .returning()

      maintenanceMode = settings.maintenanceMode
    } else {
      const [settings] = await db
        .update(GlobalSettings)
        .set({ maintenanceMode: input.value })
        .where(eq(GlobalSettings.id, 1))
        .returning()

      maintenanceMode = settings.maintenanceMode
    }

    await maintenanceCache.setMaintenanceMode(maintenanceMode)

    return { success: true, maintenanceMode }
  })
