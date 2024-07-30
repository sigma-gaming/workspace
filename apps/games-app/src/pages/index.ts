import { TelegramCallbackPage } from './callbacks/telegram'
import { VkCallbackPage } from './callbacks/vk'
import { GamesPage } from './games'
import { DiceGamePage } from './games-dice'
import { PincodeGamePage } from './games-pincode'
import { SettingsPage } from './settings'

export const PAGES = [
  GamesPage,
  DiceGamePage,
  PincodeGamePage,
  SettingsPage,
  VkCallbackPage,
  TelegramCallbackPage,
]
