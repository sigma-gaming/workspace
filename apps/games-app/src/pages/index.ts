import { TelegramCallbackPage } from './callbacks/telegram'
import { VkCallbackPage } from './callbacks/vk'
import { DiceGamePage } from './games/dice'
import { HomePage } from './home'
import { SettingsPage } from './settings'

export const PAGES = [
  HomePage,
  DiceGamePage,
  SettingsPage,
  VkCallbackPage,
  TelegramCallbackPage,
]
