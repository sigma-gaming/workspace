import { getPincodeMultiplier } from '@games/model'
import crypto from 'node:crypto'
import { createWsAction } from '../ws-action'

export function runGame(bet: number) {
  const number = crypto.randomInt(10000)
  const multiplier = getPincodeMultiplier(number)
  const hasWon = multiplier > 0
  const winAmount = Math.ceil(bet * multiplier - bet)
  return { number, multiplier, hasWon, winAmount }
}

export const PingAction = createWsAction({
  name: 'ping',
  async handler(): Promise<'pong'> {
    return 'pong'
  },
})
