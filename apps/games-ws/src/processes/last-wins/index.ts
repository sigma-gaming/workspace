import { logger } from '@core/logger'
import { gamesCache } from '@games/services'
import { sendToAllLocal } from '../../shared/send'

let lastWinSent = -1
let lastBigWinSent = -1

async function sendLastWins() {
  // Add 100ms compensation for network delays
  const next = (ms = 900) => {
    setTimeout(sendLastWins, ms)
  }

  try {
    const lastWins = await gamesCache.lastWinHistory.get()

    // Send only new records
    const newWins = lastWins.filter((gameRecord) => gameRecord.id > lastWinSent)

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
    const bigWins = await gamesCache.bigWinHistory.get()

    // Send only new records
    const newWins = bigWins.filter(
      (gameRecord) => gameRecord.id > lastBigWinSent,
    )

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
