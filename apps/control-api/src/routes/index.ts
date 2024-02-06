import { maintenanceRouter } from './maintenance'
import { notificationsRouter } from './notifications'
import { createRouter } from './trpc'

export const appRouter = createRouter({
  maintenance: maintenanceRouter,
  notifications: notificationsRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
