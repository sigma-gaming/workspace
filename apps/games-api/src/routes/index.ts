import { authRouter } from './auth'
import { balanceRouter } from './balance'
import { eventsRouter } from './events'
import { gamesRouter } from './games'
import { meRouter } from './me'
import { notificationsRouter } from './notifications'
import { settingsRouter } from './settings'
import { createRouter } from './trpc'

export const appRouter = createRouter({
  me: meRouter,
  auth: authRouter,
  settings: settingsRouter,
  balance: balanceRouter,
  games: gamesRouter,
  events: eventsRouter,
  notifications: notificationsRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
