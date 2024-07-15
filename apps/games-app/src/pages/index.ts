import { TelegramCallbackPage } from './callbacks/telegram'
import { VkCallbackPage } from './callbacks/vk'
import { GamesPage } from './games'
import { DiceGamePage } from './games-dice'
import { SettingsPage } from './settings'

export const PAGES = [
  GamesPage,
  DiceGamePage,
  SettingsPage,
  VkCallbackPage,
  TelegramCallbackPage,
]
