import { createRouter } from '../../trpc'
import { telegram } from './telegram'
import { vk } from './vk'

export const callbacksRouter = createRouter({
  vk,
  telegram,
})
