import { settingsRouter } from './settings'
import { createRouter } from './trpc'

export const appRouter = createRouter({
  settings: settingsRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
