import { notificationsRouter } from './notifications'
import { settingsRouter } from './settings'
import { createRouter } from './trpc'

export const appRouter = createRouter({
  settings: settingsRouter,
  notifications: notificationsRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
