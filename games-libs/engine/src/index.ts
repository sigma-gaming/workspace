import { playDice } from './games/dice'
import { playPincode } from './games/pincode'

export const Engine = {
  playDice,
  playPincode,
}

export * from './games/dice.contract'
export * from './games/pincode.contract'
