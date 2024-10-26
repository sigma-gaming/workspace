import { createHistoryRouter } from 'atomic-router'
import {
  affiliate,
  bonuses,
  diceGame,
  games,
  paymentFailureCallback,
  paymentSuccessCallback,
  pincodeGame,
  settings,
} from './routes'

const routes = [
  { path: '/', route: games },
  { path: '/games/dice', route: diceGame },
  { path: '/games/pincode', route: pincodeGame },
  { path: '/settings', route: settings },
  { path: '/bonuses', route: bonuses },
  { path: '/affiliate', route: affiliate },
  { path: '/callbacks/payment/success', route: paymentSuccessCallback },
  { path: '/callbacks/payment/failure', route: paymentFailureCallback },
]

export const router = createHistoryRouter({
  routes,
})
