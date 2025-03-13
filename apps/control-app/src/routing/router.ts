import { createHistoryRouter } from 'atomic-router'
import {
  budget,
  dashboard,
  maintenance,
  notifications,
  promocodes,
} from './routes'

const routes = [
  { path: '/', route: dashboard },
  { path: '/budget', route: budget },
  { path: '/notifications', route: notifications },
  { path: '/maintenance', route: maintenance },
  { path: '/promocodes', route: promocodes },
]

export const router = createHistoryRouter({
  routes,
})
