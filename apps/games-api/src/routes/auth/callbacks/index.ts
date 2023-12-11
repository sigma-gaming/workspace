import { createRouter } from '../../trpc'
import { vk } from './vk'

export const callbacksRouter = createRouter({
  vk,
})
