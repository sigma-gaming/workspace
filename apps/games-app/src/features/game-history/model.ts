import { createApiEffect } from '@core/hono-client'
import { subscriptionFactory } from '@core/io-client'
import { GameRecordSelect } from '@dbs/games-schema'
import { invoke } from '@withease/factories'
import { combine, createEvent, createStore, sample } from 'effector'
import { and, interval, not } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const initialize = createEvent()
const reset = createEvent()
const appendMyGame = createEvent<GameRecordSelect>()

const getLastWinsFx = createApiEffect(gamesApi.gameHistory.getLastWins.$get)
const getMyGamesFx = createApiEffect(gamesApi.gameHistory.getMyGames.$get)

const { receivedData: lastWinsReceived } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'gameHistory/lastWins' })
})

const $lastWinsLoaded = createStore(false)
  .on(getLastWinsFx.done, () => true)
  .reset(reset)

const $myGamesLoaded = createStore(false)
  .on(getMyGamesFx.done, () => true)
  .reset(reset)

const $lastWinsQueue = createStore<GameRecordSelect[]>([])

const $lastWins = createStore<GameRecordSelect[]>([]).on(
  getLastWinsFx.doneData,
  (_, lastWins) => lastWins,
)

const $myGames = createStore<GameRecordSelect[]>([]).on(
  getMyGamesFx.doneData,
  (_, myGames) => myGames,
)

const $lastWinsQueueOnlyNew = combine(
  $lastWinsQueue,
  $lastWins,
  (queue, lastWins) => {
    const lastWinDate = new Date(lastWins[0]?.createdAt ?? 0)
    return queue.filter((record) => new Date(record.createdAt) > lastWinDate)
  },
)

const $hasNewLastWins = $lastWinsQueueOnlyNew.map((queue) => queue.length > 0)

sample({
  clock: initialize,
  target: [getLastWinsFx, getMyGamesFx],
})

sample({
  clock: lastWinsReceived,
  source: $lastWinsQueue,
  fn: (lastWinsQueue, incomingWins) => {
    const incomingIds = new Set(incomingWins.map(({ id }) => id))

    return lastWinsQueue
      .filter((queued) => !incomingIds.has(queued.id))
      .concat(incomingWins)
      .slice(-20)
  },
  target: $lastWinsQueue,
})

const { tick: updateLastWins } = interval({
  start: initialize,
  stop: reset,
  timeout: 1000,
})

const nextWinFound = sample({
  clock: updateLastWins,
  source: $lastWinsQueueOnlyNew,
  filter: and($lastWinsLoaded, $hasNewLastWins),
  fn: (queue) => queue[0],
})

sample({
  clock: nextWinFound,
  source: $lastWinsQueue,
  fn: (queue, nextWin) =>
    queue.filter((win) => {
      // Remove outdated wins from queue
      return new Date(win.createdAt) > new Date(nextWin.createdAt)
    }),
  target: $lastWinsQueue,
})

sample({
  clock: nextWinFound,
  source: $lastWins,
  fn: (lastWins, nextWin) => [nextWin].concat(lastWins).slice(0, 10),
  target: $lastWins,
})

sample({
  clock: appendMyGame,
  source: $myGames,
  filter: $myGamesLoaded,
  fn: (myGames, newGame) => [newGame].concat(myGames).slice(0, 10),
  target: $myGames,
})

export const $$gameHistory = {
  initialize,
  reset,
  appendMyGame,
  $lastWins,
  $myGames,
}
