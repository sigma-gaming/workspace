import { authRouter } from './auth'
import { meRouter } from './me'
import { settingsRouter } from './settings'
import { createRouter } from './trpc'

export const appRouter = createRouter({
  me: meRouter,
  auth: authRouter,
  settings: settingsRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
