import { createRouter } from '../trpc'
import { callbacksRouter } from './callbacks'
import { logout } from './logout'

export const authRouter = createRouter({
  callbacks: callbacksRouter,
  logout,
})
