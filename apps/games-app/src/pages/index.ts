import { AffiliatePage } from './affiliate'
import { BonusesPage } from './bonuses'
import { PaymentFailureCallbackPage } from './callbacks/payment-failure'
import { PaymentSuccessCallbackPage } from './callbacks/payment-success'
import { GamesPage } from './games'
import { DiceGamePage } from './games-dice'
import { PincodeGamePage } from './games-pincode'
import { SettingsPage } from './settings'

export const PAGES = [
  GamesPage,
  DiceGamePage,
  PincodeGamePage,
  BonusesPage,
  SettingsPage,
  PaymentSuccessCallbackPage,
  PaymentFailureCallbackPage,
  AffiliatePage,
]
