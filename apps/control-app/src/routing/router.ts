import { createHistoryRouter } from 'atomic-router'
import { budget, dashboard, maintenance, notifications } from './routes'

const routes = [
  { path: '/', route: dashboard },
  { path: '/budget', route: budget },
  { path: '/notifications', route: notifications },
  { path: '/maintenance', route: maintenance },
]

export const router = createHistoryRouter({
  routes,
})
