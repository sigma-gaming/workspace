import { createRouter } from '../trpc'
import { getMe } from './get-me'

export const usersRouter = createRouter({
  getMe,
})
