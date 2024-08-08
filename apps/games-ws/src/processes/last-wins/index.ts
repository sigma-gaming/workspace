import { logger } from '@core/logger'
import { gamesCaches } from '@games/redis'
import { sendToAllLocal } from '../../shared/send'

let lastWinSent: string | null = null
let lastBigWinSent: string | null = null

async function sendLastWins() {
  // Add 100ms compensation for network delays
  const next = (ms = 900) => {
    setTimeout(sendLastWins, ms)
  }

  try {
    const lastWins = await gamesCaches.lastWinHistory.get()

    const lastSentIndex = lastWins.findIndex(
      (gameRecord) => gameRecord.id === lastWinSent,
    )

    // Send only new records
    const newWins = lastWins.slice(0, lastSentIndex)

    if (newWins.length === 0) {
      return next()
    }

    lastWinSent = newWins[0].id
    sendToAllLocal('gameHistory/lastWins', newWins)

    /*
     * ~1 win per second is enough for history table
     * So, send new records later if we got more than one new win
     * Max delay is 4000ms, so new visitors will not wait too long for the first portions
     * Add 100ms compensation for network delays
     */
    const delay = Math.min(4000, 1000 * newWins.length - 100)
    next(delay)
  } catch {
    logger.error('Failed to send last wins')
    return next()
  }
}

async function sendBigWins() {
  // Add 100ms compensation for network delays
  const next = (ms = 900) => {
    setTimeout(sendBigWins, ms)
  }

  try {
    const bigWins = await gamesCaches.bigWinHistory.get()

    const lastSentIndex = bigWins.findIndex(
      (gameRecord) => gameRecord.id === lastBigWinSent,
    )

    // Send only new records
    const newWins = bigWins.slice(0, lastSentIndex)

    if (newWins.length === 0) {
      return next()
    }

    lastBigWinSent = newWins[0].id
    sendToAllLocal('gameHistory/bigWins', newWins)

    /*
     * ~1 win per second is enough for history table
     * So, send new records later if we got more than one new win
     * Max delay is 4000ms, so new visitors will not wait too long for the first portions
     * Add 100ms compensation for network delays
     */
    const delay = Math.min(4000, 1000 * newWins.length - 100)
    next(delay)
  } catch {
    logger.error('Failed to send big wins')
    return next()
  }
}

export function startLastWinsBroadcast() {
  setTimeout(sendLastWins, 3000)
  setTimeout(sendBigWins, 3000)
}
