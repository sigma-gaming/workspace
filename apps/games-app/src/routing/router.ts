import { createHistoryRouter } from 'atomic-router'
import {
  dicesGame,
  home,
  settings,
  telegramCallback,
  vkCallback,
} from './routes'

const routes = [
  { path: '/', route: home },
  { path: '/games/dices', route: dicesGame },
  { path: '/settings', route: settings },
  { path: '/callbacks/vk', route: vkCallback },
  { path: '/callbacks/telegram', route: telegramCallback },
]

export const router = createHistoryRouter({
  routes,
})
