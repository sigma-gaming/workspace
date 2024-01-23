import { TelegramCallbackPage } from './callbacks/telegram'
import { VkCallbackPage } from './callbacks/vk'
import { DicesGamePage } from './games/dices'
import { HomePage } from './home'
import { SettingsPage } from './settings'

export const PAGES = [
  HomePage,
  DicesGamePage,
  SettingsPage,
  VkCallbackPage,
  TelegramCallbackPage,
]
