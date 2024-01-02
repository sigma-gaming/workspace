import { createHistoryRouter } from 'atomic-router'
import { sample } from 'effector'
import { createBrowserHistory } from 'history'
import { appStarted } from '../shared/events.ts'
import { dicesGame, home, settings, telegramRedirect } from './routes'

const routes = [
  { path: '/', route: home },
  { path: '/games/dices', route: dicesGame },
  { path: '/settings', route: settings },
  { path: '/redirect/telegram', route: telegramRedirect },
]

export const router = createHistoryRouter({
  routes,
})

sample({
  clock: appStarted,
  fn: () => createBrowserHistory(),
  target: router.setHistory,
})
