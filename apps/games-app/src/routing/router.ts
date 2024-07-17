import { createHistoryRouter } from 'atomic-router'
import {
  diceGame,
  games,
  pincodeGame,
  settings,
  telegramCallback,
  vkCallback,
} from './routes'

const routes = [
  { path: '/', route: games },
  { path: '/games/dice', route: diceGame },
  { path: '/games/pincode', route: pincodeGame },
  { path: '/settings', route: settings },
  { path: '/callbacks/vk', route: vkCallback },
  { path: '/callbacks/telegram', route: telegramCallback },
]

export const router = createHistoryRouter({
  routes,
})
