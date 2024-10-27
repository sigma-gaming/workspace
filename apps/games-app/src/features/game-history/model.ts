import { subscriptionFactory } from '@core/io-client'
import { GameRecordSelect } from '@dbs/games-schema'
import { createFactory, invoke } from '@withease/factories'
import {
  combine,
  createEvent,
  createStore,
  Effect,
  Event,
  sample,
} from 'effector'
import { and, interval, status } from 'patronum'
import { $$session } from '../../entities/session'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

export type Tab = 'last-wins' | 'big-wins' | 'my-games'

const initialize = createEvent()
const reset = createEvent()
const appendMyGame = createEvent<GameRecordSelect>()
const resetMyGames = createEvent()
const setTab = createEvent<Tab | null>()
const resetTab = createEvent()

const getLastWinsFx = createApiEffect(
  'query',
  gamesApi.gameHistory.getLastWins.$get,
)

const getBigWinsFx = createApiEffect(
  'query',
  gamesApi.gameHistory.getBigWins.$get,
)

const getMyGamesFx = createApiEffect(
  'query',
  gamesApi.gameHistory.getMyGames.$get,
)

const $lastWinsLoaded = status(getLastWinsFx).map((status) => status === 'done')
const $bigWinsLoaded = status(getBigWinsFx).map((status) => status === 'done')

const { receivedData: lastWinsReceived } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'gameHistory/lastWins' })
})

const { receivedData: bigWinsReceived } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'gameHistory/bigWins' })
})

const feedFactory = createFactory(
  (options: {
    getInitialFx: Effect<unknown, GameRecordSelect[]>
    recordsReceived: Event<GameRecordSelect[]>
  }) => {
    const { getInitialFx, recordsReceived } = options

    const $initialLoaded = createStore(false)
      .on(getInitialFx.done, () => true)
      .reset(reset)

    const $queue = createStore<GameRecordSelect[]>([])

    const $feed = createStore<GameRecordSelect[]>([])
      .on(getInitialFx.doneData, (_, records) => records)
      .reset(reset)

    const $queueOnlyNew = combine($queue, $feed, (queue, feed) => {
      const lastDate = new Date(feed[0]?.createdAt ?? 0)
      return queue.filter((record) => new Date(record.createdAt) > lastDate)
    })

    const $hasNewRecords = $queueOnlyNew.map((queue) => queue.length > 0)

    sample({
      clock: recordsReceived,
      source: $queue,
      fn: (queue, incoming) => {
        const incomingIds = new Set(incoming.map(({ id }) => id))

        return queue
          .filter((queued) => !incomingIds.has(queued.id))
          .concat(incoming)
          .slice(-20)
      },
      target: $queue,
    })

    const { tick: updateFeed } = interval({
      start: initialize,
      stop: reset,
      timeout: 1000,
    })

    const nextRecordTaken = sample({
      clock: updateFeed,
      source: $queueOnlyNew,
      filter: and($initialLoaded, $hasNewRecords),
      fn: (queue) => queue[0],
    })

    sample({
      clock: nextRecordTaken,
      source: $queue,
      fn: (queue, nextRecord) =>
        queue.filter((record) => {
          // Remove outdated wins from queue
          return new Date(record.createdAt) > new Date(nextRecord.createdAt)
        }),
      target: $queue,
    })

    sample({
      clock: nextRecordTaken,
      source: $feed,
      fn: (feed, nextRecord) => [nextRecord].concat(feed).slice(0, 10),
      target: $feed,
    })

    return $feed
  },
)

const $tab = createStore<Tab | null>('last-wins')
  .on(setTab, (_, tab) => tab)
  .reset(reset, resetTab)

const $myGamesLoaded = createStore(false)
  .on(getMyGamesFx.done, () => true)
  .reset(reset, resetMyGames)

const $myGames = createStore<GameRecordSelect[]>([])
  .on(getMyGamesFx.doneData, (_, myGames) => myGames)
  .reset(reset, resetMyGames)

const $lastWins = invoke(feedFactory, {
  getInitialFx: getLastWinsFx,
  recordsReceived: lastWinsReceived,
})

const $bigWins = invoke(feedFactory, {
  getInitialFx: getBigWinsFx,
  recordsReceived: bigWinsReceived,
})

sample({
  clock: initialize,
  target: [getLastWinsFx, getBigWinsFx],
})

sample({
  clock: initialize,
  filter: $$session.$loggedIn,
  target: getMyGamesFx,
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
  setTab,
  $tab,
  $lastWins,
  $bigWins,
  $myGames,
  $lastWinsLoaded,
  $bigWinsLoaded,
  $myGamesLoaded,
}
