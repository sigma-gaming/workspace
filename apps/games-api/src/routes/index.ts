import { createRouter } from './trpc'
import { usersRouter } from './users'

export const appRouter = createRouter({
  users: usersRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
