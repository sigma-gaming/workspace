import { createRoutesView } from 'atomic-router-react'
import { TelegramCallbackRoute } from './callbacks/telegram'
import { VkCallbackRoute } from './callbacks/vk'
import { DicesGameRoute } from './games/dices'
import { HomeRoute } from './home'
import { SettingsRoute } from './settings'

export const PageViews = createRoutesView({
  routes: [
    HomeRoute,
    DicesGameRoute,
    SettingsRoute,
    VkCallbackRoute,
    TelegramCallbackRoute,
  ],
})
