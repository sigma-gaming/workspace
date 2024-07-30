import { Hono } from 'hono'
import { playDiceRoute } from './dice'
import { playPincodeRoute } from './pincode'

export const gamesRouter = new Hono()
  .route('/playDice', playDiceRoute)
  .route('/playPincode', playPincodeRoute)
