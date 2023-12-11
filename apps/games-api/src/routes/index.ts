import { observable } from '@trpc/server/observable'
import { authRouter } from './auth'
import { createRouter, procedure } from './trpc'
import { usersRouter } from './users'

export const appRouter = createRouter({
  users: usersRouter,
  auth: authRouter,
  sub: procedure.subscription(() => {
    return observable<number>((emit) => {
      const timer = setInterval(() => {
        emit.next(Math.random())
      }, 1000)

      return () => {
        clearInterval(timer)
      }
    })
  }),
})

export type AppRouter = typeof appRouter
export { createContext } from './context'
