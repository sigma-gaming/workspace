import { authRouter } from './auth'
import { balanceRouter } from './balance'
import { meRouter } from './me'
import { settingsRouter } from './settings'
import { createRouter } from './trpc'
import { gamesRouter } from './games'

export const appRouter = createRouter({
  me: meRouter,
  auth: authRouter,
  settings: settingsRouter,
  balance: balanceRouter,
  games: gamesRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
