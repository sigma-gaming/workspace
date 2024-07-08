import { subscriptionFactory } from '@core/io-client'
import { invoke } from '@withease/factories'
import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { interval } from 'patronum'
import { gamesWs } from '../../shared/api/games-ws'
import { env } from '../../shared/env'

const MAX_SECONDS_PREPARING = 30
const SECONDS_BEFORE_RELOAD = 5

/**
 * Saves maintenance between page reloads
 * (in case when API healthcheck was executed before APP healthcheck)
 */
const saveToCookieFx = createEffect(() => {
  const preparedAt = new Date()
  preparedAt.setSeconds(preparedAt.getSeconds() + MAX_SECONDS_PREPARING)

  Cookies.set('maintenancePreparing', '1', {
    domain: env.domain,
    expires: preparedAt,
  })
})

const reloadPageFx = createEffect(() => {
  window.location.reload()
})

const { receivedData: maintenanceStarted } = invoke(() => {
  return subscriptionFactory({ ws: gamesWs, event: 'maintenance/started' })
})

const maintenancePreparing = Cookies.get('maintenancePreparing')

const $active = createStore(Boolean(maintenancePreparing)).on(
  maintenanceStarted,
  () => true,
)

sample({
  clock: maintenanceStarted,
  target: saveToCookieFx,
})

const startChecking = createEvent()

const { tick } = interval({
  start: startChecking,
  timeout: SECONDS_BEFORE_RELOAD * 1000,
})

sample({
  clock: tick,
  filter: $active,
  target: reloadPageFx,
})

export const $$maintenance = {
  startChecking,
  $active,
}
