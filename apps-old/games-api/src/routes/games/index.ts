import { createRouter } from '../../app/router'
import { ping } from './ping'
import { playDice } from './play-dice'
import { playPincode } from './play-pincode'

export const gamesRouter = createRouter()
  .route('/ping', ping)
  .route('/playDice', playDice)
  .route('/playPincode', playPincode)
