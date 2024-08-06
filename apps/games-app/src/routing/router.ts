import { createHistoryRouter } from 'atomic-router'
import {
  diceGame,
  games,
  paymentFailureCallback,
  paymentSuccessCallback,
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
  { path: '/callbacks/payment/success', route: paymentSuccessCallback },
  { path: '/callbacks/payment/failure', route: paymentFailureCallback },
]

export const router = createHistoryRouter({
  routes,
})
