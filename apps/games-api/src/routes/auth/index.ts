import { createRouter } from '../trpc'
import { logout } from './logout'
import { providersRouter } from './providers'

export const authRouter = createRouter({
  providers: providersRouter,
  logout,
})
