import { createHistoryRouter } from 'atomic-router'
import { budget, dashboard, maintenance } from './routes'

const routes = [
  { path: '/', route: dashboard },
  { path: '/budget', route: budget },
  { path: '/maintenance', route: maintenance },
]

export const router = createHistoryRouter({
  routes,
})
