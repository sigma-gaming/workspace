import { createRouter } from '../trpc'
import { callbacksRouter } from './callbacks'

export const authRouter = createRouter({
  callbacks: callbacksRouter,
})
