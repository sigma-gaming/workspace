import { authRouter } from './auth'
import { balanceRouter } from './balance'
import { meRouter } from './me'
import { settingsRouter } from './settings'
import { createRouter } from './trpc'

export const appRouter = createRouter({
  me: meRouter,
  auth: authRouter,
  settings: settingsRouter,
  balance: balanceRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
