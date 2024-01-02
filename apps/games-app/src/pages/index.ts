import { createRoutesView } from 'atomic-router-react'
import { DicesGameRoute } from './games/dices'
import { HomeRoute } from './home'
import { SettingsRoute } from './settings'
import { TelegramRedirectRoute } from './telegram-redirect'

export const PageViews = createRoutesView({
  routes: [HomeRoute, DicesGameRoute, SettingsRoute, TelegramRedirectRoute],
})
